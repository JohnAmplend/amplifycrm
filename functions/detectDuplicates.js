import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Simple fuzzy matching function (Levenshtein distance based)
function fuzzyMatch(str1, str2) {
  if (!str1 || !str2) return 0;
  
  str1 = String(str1).toLowerCase().trim();
  str2 = String(str2).toLowerCase().trim();
  
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type } = await req.json();
    
    if (!entity_type || !['Contact', 'Company', 'Lead'].includes(entity_type)) {
      return Response.json({ 
        error: 'Invalid entity_type. Must be Contact, Company, or Lead' 
      }, { status: 400 });
    }

    // Get active rules for this entity type
    const rules = await base44.asServiceRole.entities.Duplicate_Rules.filter({
      entity_type,
      active: true
    });

    if (rules.length === 0) {
      return Response.json({
        message: 'No active duplicate detection rules found for ' + entity_type,
        duplicates_found: 0
      });
    }

    // Get all records for this entity type
    let records = [];
    if (entity_type === 'Contact') {
      records = await base44.asServiceRole.entities.Contact.list();
    } else if (entity_type === 'Company') {
      records = await base44.asServiceRole.entities.Company.list();
    } else if (entity_type === 'Lead') {
      records = await base44.asServiceRole.entities.Lead.list();
    }

    let duplicatesFound = 0;
    const processedPairs = new Set();

    // Compare each pair of records
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const record1 = records[i];
        const record2 = records[j];
        
        const pairKey = [record1.id, record2.id].sort().join('_');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        let totalScore = 0;
        let maxPossibleScore = 0;
        const matchedFields = [];

        // Calculate similarity based on rules
        for (const rule of rules) {
          const field = rule.field_name;
          const value1 = record1[field];
          const value2 = record2[field];

          maxPossibleScore += rule.weight;

          if (!value1 || !value2) continue;

          let fieldMatches = false;

          if (rule.match_type === 'exact') {
            if (String(value1).toLowerCase().trim() === String(value2).toLowerCase().trim()) {
              totalScore += rule.weight;
              fieldMatches = true;
            }
          } else if (rule.match_type === 'fuzzy') {
            const similarity = fuzzyMatch(value1, value2);
            if (similarity >= 0.8) { // 80% similarity threshold
              totalScore += rule.weight * similarity;
              fieldMatches = true;
            }
          }

          if (fieldMatches) {
            matchedFields.push(field);
          }
        }

        // Calculate percentage score
        const similarityScore = maxPossibleScore > 0 
          ? Math.round((totalScore / maxPossibleScore) * 100) 
          : 0;

        // Get threshold from first rule (or use default)
        const threshold = (rules[0]?.threshold || 0.7) * 100;

        // If similarity exceeds threshold, check if already exists
        if (similarityScore >= threshold && matchedFields.length > 0) {
          const existingDuplicate = await base44.asServiceRole.entities.Duplicate_Records.filter({
            record_type: entity_type,
            primary_record_id: record1.id,
            duplicate_record_id: record2.id
          });

          if (existingDuplicate.length === 0) {
            // Create new duplicate record
            await base44.asServiceRole.entities.Duplicate_Records.create({
              record_type: entity_type,
              primary_record_id: record1.id,
              duplicate_record_id: record2.id,
              similarity_score: similarityScore,
              matching_fields: matchedFields.join(', '),
              status: 'Pending'
            });
            duplicatesFound++;
          }
        }
      }
    }

    return Response.json({
      success: true,
      entity_type,
      records_scanned: records.length,
      duplicates_found: duplicatesFound,
      rules_applied: rules.length
    });

  } catch (error) {
    console.error('Duplicate detection error:', error);
    return Response.json({ 
      error: error.message || 'Failed to detect duplicates' 
    }, { status: 500 });
  }
});