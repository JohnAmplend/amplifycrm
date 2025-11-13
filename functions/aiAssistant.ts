import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai@4.73.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
            return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });
        
        const body = await req.json();
        const { action = "chat", prompt, context = {}, model = "gpt-4o-mini" } = body;

        let systemPrompt = "You are a helpful AI assistant for a CRM system. Provide clear, actionable advice.";
        let userPrompt = prompt;
        let responseFormat = undefined;

        switch (action) {
            case "draft_email":
                systemPrompt = "You are an expert email writer. Write professional, engaging emails for business communications. Be concise and persuasive.";
                userPrompt = `Write an email: ${prompt}`;
                break;
            case "summarize_contact":
                systemPrompt = "You are a data analyst. Summarize information clearly and highlight key insights.";
                userPrompt = `Summarize the following: ${prompt}`;
                break;
            case "analyze_data":
                systemPrompt = "You are a business analyst. Analyze data and provide actionable insights with specific recommendations.";
                userPrompt = `Analyze: ${prompt}`;
                break;
            case "generate_task_list":
                systemPrompt = "You are a productivity expert. Generate clear, actionable task lists with priorities.";
                userPrompt = `Create a task list for: ${prompt}`;
                responseFormat = { type: "json_object" };
                break;
            case "suggest_next_steps":
                systemPrompt = "You are a strategic advisor. Suggest next steps and action items based on the situation.";
                userPrompt = `Suggest next steps for: ${prompt}`;
                break;
        }

        const requestOptions = {
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
        };

        if (responseFormat) {
            requestOptions.response_format = responseFormat;
        }

        const completion = await openai.chat.completions.create(requestOptions);
        
        const response = completion.choices[0].message.content;
        const usage = completion.usage;

        // Calculate estimated cost (pricing as of 2024)
        const costPerMillionPromptTokens = model === "gpt-4o" ? 5.00 : 
                                          model === "gpt-4-turbo" ? 10.00 : 0.15; // gpt-4o-mini
        const costPerMillionCompletionTokens = model === "gpt-4o" ? 15.00 : 
                                                model === "gpt-4-turbo" ? 30.00 : 0.60; // gpt-4o-mini
        
        const estimatedCost = (
            (usage.prompt_tokens / 1000000) * costPerMillionPromptTokens +
            (usage.completion_tokens / 1000000) * costPerMillionCompletionTokens
        );

        // Log token usage using service role
        try {
            await base44.asServiceRole.entities.Token_Usage.create({
                user_email: user.email,
                user_name: user.full_name || user.email,
                action_type: action,
                model: model,
                prompt_tokens: usage.prompt_tokens,
                completion_tokens: usage.completion_tokens,
                total_tokens: usage.total_tokens,
                estimated_cost: estimatedCost,
                source: "AI Assistant"
            });
        } catch (logError) {
            console.error("Failed to log token usage:", logError);
        }

        return Response.json({
            response: responseFormat ? JSON.parse(response) : response,
            usage: {
                prompt_tokens: usage.prompt_tokens,
                completion_tokens: usage.completion_tokens,
                total_tokens: usage.total_tokens,
                estimated_cost: estimatedCost.toFixed(6)
            }
        });

    } catch (error) {
        console.error('AI Assistant error:', error);
        return Response.json({ 
            error: error.message || 'An unexpected error occurred',
            details: error.toString()
        }, { status: 500 });
    }
});