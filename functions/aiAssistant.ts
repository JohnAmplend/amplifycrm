import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai@4.47.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, prompt, context, model = "gpt-4o-mini" } = body;

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY"),
        });

        let systemPrompt = "You are an AI assistant integrated into AmplifyCRM. You help users with CRM tasks, data analysis, email writing, and business insights.";
        let messages = [];

        switch (action) {
            case "chat":
                // General chat assistant
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ];
                break;

            case "draft_email":
                // Draft email based on context
                systemPrompt = "You are a professional email writer. Create clear, concise, and professional emails based on the user's requirements. Format the output as JSON with 'subject' and 'body' fields.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Create an email with the following details:\n${prompt}\n\nContext: ${JSON.stringify(context || {})}` }
                ];
                break;

            case "summarize_contact":
                // Summarize contact information
                systemPrompt = "You are a CRM data analyst. Analyze contact information and provide a concise, actionable summary highlighting key insights, engagement patterns, and recommended next steps.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Summarize this contact:\n${JSON.stringify(context)}` }
                ];
                break;

            case "summarize_deal":
                // Summarize deal information
                systemPrompt = "You are a sales analyst. Analyze deal information and provide insights on deal health, potential risks, and recommendations to move it forward.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this deal:\n${JSON.stringify(context)}` }
                ];
                break;

            case "analyze_data":
                // Analyze data patterns
                systemPrompt = "You are a business intelligence analyst. Analyze the provided data and generate insights, trends, and actionable recommendations.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this data:\n${JSON.stringify(context)}\n\nUser question: ${prompt}` }
                ];
                break;

            case "generate_task_list":
                // Generate task list based on context
                systemPrompt = "You are a productivity expert. Based on the provided context, generate a prioritized list of tasks. Format as a JSON array of objects with 'task_name', 'priority', and 'description' fields.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate tasks for:\n${prompt}\n\nContext: ${JSON.stringify(context || {})}` }
                ];
                break;

            case "extract_insights":
                // Extract insights from conversation or notes
                systemPrompt = "You are a conversation analyst. Extract key insights, action items, and important details from the provided text.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Extract insights from:\n${prompt}` }
                ];
                break;

            case "suggest_next_steps":
                // Suggest next steps for a deal or contact
                systemPrompt = "You are a sales strategist. Based on the current situation, suggest specific next steps to advance the relationship or close the deal.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Current situation:\n${JSON.stringify(context)}\n\nAdditional info: ${prompt}` }
                ];
                break;

            case "rewrite_content":
                // Rewrite content in a different tone
                systemPrompt = "You are a professional copywriter. Rewrite the provided content according to the user's specifications while maintaining the core message.";
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Rewrite this:\n${prompt}\n\nInstructions: ${context?.instructions || 'Make it more professional'}` }
                ];
                break;

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Check if we need JSON response
        const needsJSON = ["draft_email", "generate_task_list"].includes(action);

        const requestOptions = {
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        };

        if (needsJSON) {
            requestOptions.response_format = { type: "json_object" };
        }

        const response = await openai.chat.completions.create(requestOptions);

        const aiResponse = response.choices[0].message.content;

        // Parse JSON if needed
        let parsedResponse = aiResponse;
        if (needsJSON) {
            try {
                parsedResponse = JSON.parse(aiResponse);
            } catch (e) {
                // If JSON parsing fails, return as text
                parsedResponse = { content: aiResponse };
            }
        }

        return Response.json({
            success: true,
            response: parsedResponse,
            usage: {
                prompt_tokens: response.usage.prompt_tokens,
                completion_tokens: response.usage.completion_tokens,
                total_tokens: response.usage.total_tokens
            }
        });

    } catch (error) {
        console.error('AI Assistant Error:', error);
        return Response.json({ 
            error: error.message || 'Failed to process AI request',
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
});