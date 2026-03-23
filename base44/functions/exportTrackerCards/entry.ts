import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { board_id } = await req.json();

        // Fetch boards, columns, and cards
        const boards = board_id 
            ? await base44.entities.Tracker_Board.filter({ id: board_id })
            : await base44.entities.Tracker_Board.list();
        
        const columns = board_id
            ? await base44.entities.Tracker_Column.filter({ board_id })
            : await base44.entities.Tracker_Column.list();
        
        const cards = board_id
            ? await base44.entities.Tracker_Card.filter({ column_id: columns.map(c => c.id) })
            : await base44.entities.Tracker_Card.list();

        // Create export data with mappings
        const exportData = {
            export_date: new Date().toISOString(),
            exported_by: user.email,
            boards: boards.map(board => ({
                id: board.id,
                name: board.board_name,
                description: board.description,
                color: board.color
            })),
            columns: columns.map(col => ({
                id: col.id,
                board_id: col.board_id,
                title: col.title,
                color: col.color,
                position: col.position
            })),
            cards: cards.map(card => ({
                id: card.id,
                column_id: card.column_id,
                title: card.title,
                description: card.description,
                priority: card.priority,
                status: card.status,
                start_date: card.start_date,
                end_date: card.end_date,
                progress: card.progress,
                total_tasks: card.total_tasks,
                completed_tasks: card.completed_tasks,
                assigned_to: card.assigned_to,
                collaborators: card.collaborators,
                attachments: card.attachments,
                comments: card.comments
            }))
        };

        // Convert to CSV-friendly format
        const csvData = cards.map(card => {
            const column = columns.find(c => c.id === card.column_id);
            const board = boards.find(b => b.id === column?.board_id);
            
            return {
                'Board Name': board?.board_name || '',
                'Column Title': column?.title || '',
                'Card Title': card.title,
                'Description': card.description || '',
                'Priority': card.priority,
                'Status': card.status,
                'Start Date': card.start_date || '',
                'End Date': card.end_date || '',
                'Progress': card.progress || 0,
                'Assigned To': card.assigned_to || '',
                'Collaborators': card.collaborators?.join(', ') || '',
                'Total Tasks': card.total_tasks || 0,
                'Completed Tasks': card.completed_tasks || 0
            };
        });

        return Response.json({
            json_data: exportData,
            csv_data: csvData,
            total_cards: cards.length,
            total_columns: columns.length,
            total_boards: boards.length
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});