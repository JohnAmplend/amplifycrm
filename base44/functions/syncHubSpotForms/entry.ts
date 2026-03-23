import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  const syncStartTime = new Date().toISOString();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
    if (!HUBSPOT_API_KEY) {
      return Response.json({ 
        error: 'HubSpot API key not configured' 
      }, { status: 400 });
    }

    // Create sync log entry
    const syncLog = await base44.asServiceRole.entities.Sync_Log.create({
      sync_type: 'HubSpot Forms',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // Fetch all forms
    const response = await fetch('https://api.hubapi.com/forms/v2/forms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      await base44.asServiceRole.entities.Sync_Log.update(syncLog.id, {
        sync_status: 'Failed',
        sync_completed_at: new Date().toISOString(),
        error_details: `Failed to fetch from HubSpot: ${errorText}`
      });
      
      return Response.json({ 
        error: 'Failed to fetch from HubSpot', 
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const allForms = await response.json();

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Get existing forms
    const existingForms = await base44.asServiceRole.entities.Form.list();

    for (const hsForm of allForms) {
      try {
        const formData = {
          form_name: hsForm.name || '',
          form_description: hsForm.description || '',
          form_type: 'Contact Form',
          submit_action: 'Create Contact',
          thank_you_message: hsForm.inlineMessage || '',
          redirect_url: hsForm.redirectUrl || '',
          is_active: !hsForm.deletedAt,
          submissions_count: hsForm.submissions || 0,
          custom_data: {
            hubspot_id: hsForm.guid,
            hubspot_created: hsForm.createdAt,
            hubspot_updated: hsForm.updatedAt,
            hubspot_fields: hsForm.formFieldGroups
          }
        };

        const existingForm = existingForms.find(f => 
          f.custom_data?.hubspot_id === hsForm.guid
        );

        if (existingForm) {
          await base44.asServiceRole.entities.Form.update(existingForm.id, formData);
          updatedCount++;
        } else {
          const newForm = await base44.asServiceRole.entities.Form.create(formData);
          createdCount++;

          // Create form fields
          if (hsForm.formFieldGroups && newForm.id) {
            for (const fieldGroup of hsForm.formFieldGroups) {
              for (const field of fieldGroup.fields || []) {
                try {
                  await base44.asServiceRole.entities.Form_Field.create({
                    form_id: newForm.id,
                    field_label: field.label || '',
                    field_name: field.name || '',
                    field_type: mapFieldType(field.fieldType),
                    is_required: field.required || false,
                    placeholder_text: field.placeholder || '',
                    field_order: field.displayOrder || 0
                  });
                } catch (fieldError) {
                  console.error('Error creating form field:', fieldError);
                }
              }
            }
          }
        }

      } catch (error) {
        errorCount++;
        errors.push({
          form: hsForm.name || hsForm.guid,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_forms: allForms.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      fields_synced: 8
    };

    await base44.asServiceRole.entities.Sync_Log.update(syncLog.id, {
      sync_status: errorCount > 0 ? 'Partial' : 'Completed',
      sync_completed_at: syncCompleteTime,
      records_synced: createdCount + updatedCount,
      records_created: createdCount,
      records_updated: updatedCount,
      records_failed: errorCount,
      sync_summary: summary,
      error_details: errors.length > 0 ? JSON.stringify(errors) : null
    });

    return Response.json({
      success: true,
      summary,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('HubSpot forms sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot forms' 
    }, { status: 500 });
  }
});

function mapFieldType(hsFieldType) {
  const typeMap = {
    'text': 'Text',
    'textarea': 'Textarea',
    'email': 'Email',
    'phone': 'Phone',
    'select': 'Dropdown',
    'checkbox': 'Checkbox',
    'radio': 'Radio',
    'file': 'File Upload',
    'hidden': 'Hidden'
  };
  return typeMap[hsFieldType?.toLowerCase()] || 'Text';
}