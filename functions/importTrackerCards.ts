import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { import_data, mapping_mode = 'create_new' } = await req.json();

        if (!import_data || !import_data.cards) {
            return Response.json({ error: 'Invalid import data' }, { status: 400 });
        }

        const results = {
            boards_created: 0,
            columns_created: 0,
            cards_created: 0,
            cards_updated: 0,
            errors: []
        };

        // Board and column ID mappings (old ID -> new ID)
        const boardMapping = {};
        const columnMapping = {};

        // Step 1: Handle boards
        if (mapping_mode === 'create_new' && import_data.boards) {
            for (const board of import_data.boards) {
                try {
                    const newBoard = await base44.entities.Tracker_Board.create({
                        board_name: board.name,
                        description: board.description,
                        color: board.color
                    });
                    boardMapping[board.id] = newBoard.id;
                    results.boards_created++;
                } catch (error) {
                    results.errors.push(`Board creation failed: ${error.message}`);
                }
            }
        } else if (mapping_mode === 'map_existing') {
            // Use existing boards
            const existingBoards = await base44.entities.Tracker_Board.list();
            import_data.boards?.forEach(board => {
                const existing = existingBoards.find(b => b.board_name === board.name);
                if (existing) {
                    boardMapping[board.id] = existing.id;
                }
            });
        }

        // Step 2: Handle columns
        if (mapping_mode === 'create_new' && import_data.columns) {
            for (const column of import_data.columns) {
                const mappedBoardId = boardMapping[column.board_id];
                if (!mappedBoardId) {
                    results.errors.push(`Column "${column.title}" skipped: board not mapped`);
                    continue;
                }

                try {
                    const newColumn = await base44.entities.Tracker_Column.create({
                        board_id: mappedBoardId,
                        title: column.title,
                        color: column.color,
                        position: column.position
                    });
                    columnMapping[column.id] = newColumn.id;
                    results.columns_created++;
                } catch (error) {
                    results.errors.push(`Column creation failed: ${error.message}`);
                }
            }
        } else if (mapping_mode === 'map_existing') {
            // Use existing columns
            const existingColumns = await base44.entities.Tracker_Column.list();
            import_data.columns?.forEach(column => {
                const existing = existingColumns.find(c => 
                    c.title === column.title && boardMapping[column.board_id] === c.board_id
                );
                if (existing) {
                    columnMapping[column.id] = existing.id;
                }
            });
        }

        // Step 3: Import cards
        for (const card of import_data.cards) {
            const mappedColumnId = columnMapping[card.column_id];
            if (!mappedColumnId) {
                results.errors.push(`Card "${card.title}" skipped: column not mapped`);
                continue;
            }

            try {
                const cardData = {
                    column_id: mappedColumnId,
                    title: card.title,
                    description: card.description,
                    priority: card.priority,
                    status: card.status,
                    start_date: card.start_date,
                    end_date: card.end_date,
                    progress: card.progress || 0,
                    total_tasks: card.total_tasks || 0,
                    completed_tasks: card.completed_tasks || 0,
                    assigned_to: card.assigned_to,
                    collaborators: card.collaborators || [],
                    attachments: card.attachments || [],
                    comments: card.comments || []
                };

                await base44.entities.Tracker_Card.create(cardData);
                results.cards_created++;
            } catch (error) {
                results.errors.push(`Card "${card.title}" failed: ${error.message}`);
            }
        }

        return Response.json({
            success: true,
            results,
            mapping: {
                boards: boardMapping,
                columns: columnMapping
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});