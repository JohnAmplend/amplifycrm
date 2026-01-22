import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Trash2, Save, X, Mail, Clock, ArrowRight } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import { toast } from "../components/crm/useToast";

export default function SequenceBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sequenceId, setSequenceId] = useState(null);
  
  const [sequenceData, setSequenceData] = useState({
    sequence_name: "",
    description: "",
    enrollment_trigger: "Manual",
    is_active: false
  });

  const [emails, setEmails] = useState([{
    step_number: 1,
    delay_days: 0,
    delay_hours: 0,
    subject_line: "",
    email_body: ""
  }]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setSequenceId(id);
      loadSequence(id);
    }
  }, []);

  const loadSequence = async (id) => {
    try {
      const sequence = await base44.entities.Email_Sequence.get(id);
      setSequenceData({
        sequence_name: sequence.sequence_name,
        description: sequence.description,
        enrollment_trigger: sequence.enrollment_trigger,
        is_active: sequence.is_active
      });

      const sequenceEmails = await base44.entities.Sequence_Email.filter({ sequence_id: id });
      if (sequenceEmails.length > 0) {
        setEmails(sequenceEmails.sort((a, b) => a.step_number - b.step_number));
      }
    } catch (error) {
      toast.error('Failed to load sequence');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let sequence;
      if (sequenceId) {
        await base44.entities.Email_Sequence.update(sequenceId, sequenceData);
        sequence = { id: sequenceId };
        
        // Delete existing emails
        const existingEmails = await base44.entities.Sequence_Email.filter({ sequence_id: sequenceId });
        await Promise.all(existingEmails.map(e => base44.entities.Sequence_Email.delete(e.id)));
      } else {
        sequence = await base44.entities.Email_Sequence.create(sequenceData);
      }

      // Create new emails
      await Promise.all(emails.map(email =>
        base44.entities.Sequence_Email.create({
          sequence_id: sequence.id,
          step_number: email.step_number,
          delay_days: email.delay_days,
          delay_hours: email.delay_hours,
          subject_line: email.subject_line,
          email_body: email.email_body
        })
      ));

      return sequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sequences']);
      toast.success(sequenceId ? 'Sequence updated' : 'Sequence created');
      navigate(createPageUrl("EmailSequences"));
    },
    onError: (error) => {
      toast.error('Failed to save sequence: ' + error.message);
    }
  });

  const addEmail = () => {
    setEmails([...emails, {
      step_number: emails.length + 1,
      delay_days: 1,
      delay_hours: 0,
      subject_line: "",
      email_body: ""
    }]);
  };

  const removeEmail = (index) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.map((e, i) => ({ ...e, step_number: i + 1 })));
  };

  const updateEmail = (index, field, value) => {
    const newEmails = [...emails];
    newEmails[index] = { ...newEmails[index], [field]: value };
    setEmails(newEmails);
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
            {sequenceId ? 'Edit Sequence' : 'Create Email Sequence'}
          </h1>
          <NeuroButton onClick={() => navigate(createPageUrl("EmailSequences"))}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </NeuroButton>
        </div>

        {/* Sequence Details */}
        <NeuroCard className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Sequence Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeuroInput
              label="Sequence Name"
              value={sequenceData.sequence_name}
              onChange={(e) => setSequenceData({ ...sequenceData, sequence_name: e.target.value })}
              placeholder="e.g., New Lead Nurture"
              required
            />
            <NeuroSelect
              label="Enrollment Trigger"
              value={sequenceData.enrollment_trigger}
              onChange={(e) => setSequenceData({ ...sequenceData, enrollment_trigger: e.target.value })}
              options={[
                { value: 'Manual', label: 'Manual' },
                { value: 'Form Submit', label: 'Form Submit' },
                { value: 'Lead Score', label: 'Lead Score' },
                { value: 'Lifecycle Stage Change', label: 'Lifecycle Stage Change' }
              ]}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                Description
              </label>
              <textarea
                value={sequenceData.description}
                onChange={(e) => setSequenceData({ ...sequenceData, description: e.target.value })}
                className="ampvibe-input w-full min-h-[80px]"
                placeholder="Describe the purpose of this sequence..."
              />
            </div>
          </div>
        </NeuroCard>

        {/* Email Steps */}
        <div className="space-y-4 mb-6">
          {emails.map((email, index) => (
            <NeuroCard key={index}>
              <div className="flex items-start gap-4">
                <div className="ampvibe-button-primary w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {email.step_number}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold" style={{ color: "#666" }}>
                      Email {email.step_number}
                    </h3>
                    {emails.length > 1 && (
                      <button
                        onClick={() => removeEmail(index)}
                        className="ampvibe-button p-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {index > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <NeuroInput
                        label="Delay (Days)"
                        type="number"
                        min="0"
                        value={email.delay_days}
                        onChange={(e) => updateEmail(index, 'delay_days', parseInt(e.target.value) || 0)}
                      />
                      <NeuroInput
                        label="Delay (Hours)"
                        type="number"
                        min="0"
                        max="23"
                        value={email.delay_hours}
                        onChange={(e) => updateEmail(index, 'delay_hours', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  <NeuroInput
                    label="Subject Line"
                    value={email.subject_line}
                    onChange={(e) => updateEmail(index, 'subject_line', e.target.value)}
                    placeholder="Enter email subject..."
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                      Email Body
                    </label>
                    <textarea
                      value={email.email_body}
                      onChange={(e) => updateEmail(index, 'email_body', e.target.value)}
                      className="ampvibe-input w-full min-h-[150px]"
                      placeholder="Write your email content here..."
                    />
                  </div>
                </div>
              </div>
            </NeuroCard>
          ))}
        </div>

        {/* Add Email Button */}
        <NeuroButton onClick={addEmail} className="w-full mb-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Email to Sequence
        </NeuroButton>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <NeuroButton onClick={() => navigate(createPageUrl("EmailSequences"))}>
            Cancel
          </NeuroButton>
          <NeuroButton 
            variant="primary" 
            onClick={() => saveMutation.mutate()}
            disabled={!sequenceData.sequence_name || emails.some(e => !e.subject_line)}
          >
            <Save className="w-4 h-4 mr-2" />
            {sequenceId ? 'Update Sequence' : 'Create Sequence'}
          </NeuroButton>
        </div>
      </div>
    </div>
  );
}