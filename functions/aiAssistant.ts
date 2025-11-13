import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai@4.47.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            return Response.json({ 
                error: 'OpenAI API key not configured',
                details: 'Please set the OPENAI_API_KEY environment variable.'
            }, { status: 500 });
        }

        const body = await req.json();
        const { action = "chat", prompt, context, model = "gpt-4o-mini" } = body;

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey: apiKey });

        let systemPrompt = "You are an AI assistant integrated into AmplifyCRM. You help users with CRM tasks, data analysis, email writing, and business insights.";
        let userPrompt = prompt;

        switch (action) {
            case "draft_email":
                systemPrompt = "You are a professional email writer. Create clear, concise, and professional emails based on the user's requirements. Format the output as JSON with 'subject' and 'body' fields.";
                userPrompt = `Create an email with the following details:\n${prompt}\n\nContext: ${JSON.stringify(context || {})}`;
                break;

            case "summarize_contact":
                systemPrompt = "You are a CRM data analyst. Analyze contact information and provide a concise, actionable summary highlighting key insights, engagement patterns, and recommended next steps.";
                userPrompt = `Summarize this contact:\n${JSON.stringify(context)}`;
                break;

            case "summarize_deal":
                systemPrompt = "You are a sales analyst. Analyze deal information and provide insights on deal health, potential risks, and recommendations to move it forward.";
                userPrompt = `Analyze this deal:\n${JSON.stringify(context)}`;
                break;

            case "analyze_data":
                systemPrompt = "You are a business intelligence analyst. Analyze the provided data and generate insights, trends, and actionable recommendations.";
                userPrompt = `Analyze this data:\n${JSON.stringify(context)}\n\nUser question: ${prompt}`;
                break;

            case "generate_task_list":
                systemPrompt = "You are a productivity expert. Based on the provided context, generate a prioritized list of tasks. Format as a JSON array of objects with 'task_name', 'priority', and 'description' fields.";
                userPrompt = `Generate tasks for:\n${prompt}\n\nContext: ${JSON.stringify(context || {})}`;
                break;

            case "extract_insights":
                systemPrompt = "You are a conversation analyst. Extract key insights, action items, and important details from the provided text.";
                userPrompt = `Extract insights from:\n${prompt}`;
                break;

            case "suggest_next_steps":
                systemPrompt = "You are a sales strategist. Based on the current situation, suggest specific next steps to advance the relationship or close the deal.";
                userPrompt = `Current situation:\n${JSON.stringify(context)}\n\nAdditional info: ${prompt}`;
                break;

            case "rewrite_content":
                systemPrompt = "You are a professional copywriter. Rewrite the provided content according to the user's specifications while maintaining the core message.";
                userPrompt = `Rewrite this:\n${prompt}\n\nInstructions: ${context?.instructions || 'Make it more professional'}`;
                break;
        }

        const needsJSON = ["draft_email", "generate_task_list"].includes(action);

        const requestOptions = {
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        };

        if (needsJSON) {
            requestOptions.response_format = { type: "json_object" };
        }

        const response = await openai.chat.completions.create(requestOptions);

        if (!response || !response.choices || !response.choices[0]) {
            return Response.json({ 
                error: 'Invalid response from OpenAI'
            }, { status: 500 });
        }

        const aiResponse = response.choices[0].message.content;

        let parsedResponse = aiResponse;
        if (needsJSON) {
            try {
                parsedResponse = JSON.parse(aiResponse);
            } catch (e) {
                parsedResponse = { content: aiResponse };
            }
        }

        return Response.json({
            success: true,
            response: parsedResponse,
            usage: {
                prompt_tokens: response.usage?.prompt_tokens || 0,
                completion_tokens: response.usage?.completion_tokens || 0,
                total_tokens: response.usage?.total_tokens || 0
            }
        });

    } catch (error) {
        console.error('AI Assistant Error:', error);
        
        let errorMessage = 'Failed to process AI request';
        let errorDetails = error.message || error.toString();
        
        if (error.message?.includes('API key')) {
            errorMessage = 'Invalid OpenAI API key';
            errorDetails = 'Please check that your OPENAI_API_KEY is valid.';
        } else if (error.message?.includes('rate_limit')) {
            errorMessage = 'Rate limit exceeded';
            errorDetails = 'Please wait and try again.';
        } else if (error.message?.includes('insufficient_quota')) {
            errorMessage = 'Insufficient OpenAI credits';
            errorDetails = 'Please add credits to your OpenAI account.';
        }
        
        return Response.json({ 
            error: errorMessage,
            details: errorDetails
        }, { status: 500 });
    }
});