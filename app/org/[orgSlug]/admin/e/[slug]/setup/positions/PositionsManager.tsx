"use client";
import { toastPrompt } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Edit2, Trash2, AlertTriangle, Users } from "lucide-react";
import { createPosition, updatePosition, deletePosition, reorderPositions } from "@/app/actions/setup";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Position = {
  id: string;
  title: string;
  required: boolean;
  order: number;
  _count: { candidates: number };
};

export default function PositionsManager({ 
  orgSlug,
  electionId, 
  electionSlug,
  initialPositions, 
  isLocked 
}: { 
  orgSlug: string;
  electionId: string;
  electionSlug: string;
  initialPositions: Position[]; 
  isLocked: boolean;
}) {
  const [positions, setPositions] = useState(initialPositions);
  const [isPending, setIsPending] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const router = useRouter();

  const handleDragEnd = async (result: DropResult) => {
    if (isLocked) return;
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(positions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update optimistic order
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    setPositions(updatedItems);

    // Save to DB
    await reorderPositions(electionId, updatedItems.map(i => ({ id: i.id, order: i.order })));
    router.refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isLocked) return;

    setIsPending(true);
    const res = await createPosition(electionId, newTitle, newRequired);
    if (res.success) {
      setNewTitle("");
      setNewRequired(true);
      setIsAdding(false);
      router.refresh();
      // Optimistic update would be better, but refresh is simpler for now
      // Let's just reload the page basically to get the new ID
      window.location.reload(); 
    } else {
      toast.error(res.error || "Failed to create position");
    }
    setIsPending(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPos || !editingPos.title.trim() || isLocked) return;

    setIsPending(true);
    const res = await updatePosition(electionId, editingPos.id, editingPos.title, editingPos.required);
    if (res.success) {
      setPositions(positions.map(p => p.id === editingPos.id ? { ...p, title: editingPos.title, required: editingPos.required } : p));
      setEditingPos(null);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update position");
    }
    setIsPending(false);
  };

  const handleDelete = async (pos: Position) => {
    if (isLocked) return;
    if (pos._count.candidates > 0) {
      toast("Cannot delete position that has candidates. Delete the candidates first.");
      return;
    }

    const confirmName = (await toastPrompt(`To delete this position, type its name exactly: "${pos.title}"`));
    if (confirmName !== pos.title) {
      if (confirmName !== null) toast("Name did not match. Deletion cancelled.");
      return;
    }

    setIsPending(true);
    const res = await deletePosition(electionId, pos.id);
    if (res.success) {
      setPositions(positions.filter(p => p.id !== pos.id));
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete position");
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-500" />
          <p className="text-sm font-medium">Election is live. Setup is locked.</p>
        </div>
      )}

      <div className="flex justify-end">
        {!isLocked && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary py-2 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Position
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm animate-scale-in">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">New Position</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Position Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
                className="input-field"
                placeholder="e.g. President"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="w-4 h-4 text-primary-500 rounded border-surface-300 focus:ring-primary-500"
                />
                Required position (voters must select a candidate)
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary py-2 text-sm" disabled={isPending}>Cancel</button>
              <button type="submit" className="btn-primary py-2 text-sm" disabled={isPending || !newTitle.trim()}>Save Position</button>
            </div>
          </div>
        </form>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="positions-list" isDropDisabled={isLocked}>
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="space-y-3"
            >
              {positions.length === 0 && !isAdding ? (
                <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center text-surface-500 border-dashed">
                  No positions added yet.
                </div>
              ) : (
                positions.map((pos, index) => (
                  <Draggable key={pos.id} draggableId={pos.id} index={index} isDragDisabled={isLocked}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-xl border transition-all ${
                          snapshot.isDragging ? "border-primary-400 shadow-lg scale-[1.02] z-10" : "border-surface-200 shadow-sm"
                        }`}
                      >
                        {editingPos?.id === pos.id ? (
                          <form onSubmit={handleUpdate} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-1 space-y-3 w-full">
                              <input 
                                type="text" 
                                value={editingPos.title}
                                onChange={(e) => setEditingPos({...editingPos, title: e.target.value})}
                                required
                                autoFocus
                                className="input-field py-2"
                              />
                              <label className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={editingPos.required}
                                  onChange={(e) => setEditingPos({...editingPos, required: e.target.checked})}
                                  className="w-4 h-4 text-primary-500 rounded border-surface-300 focus:ring-primary-500"
                                />
                                Required position
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingPos(null)} className="btn-secondary py-1.5 px-3 text-sm" disabled={isPending}>Cancel</button>
                              <button type="submit" className="btn-primary py-1.5 px-3 text-sm" disabled={isPending || !editingPos.title.trim()}>Save</button>
                            </div>
                          </form>
                        ) : (
                          <div className="p-4 flex items-center gap-4">
                            {!isLocked && (
                              <div {...provided.dragHandleProps} className="text-surface-400 hover:text-surface-700 transition-colors p-1 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                                {pos.title}
                                {!pos.required && <span className="text-[10px] uppercase tracking-wider bg-surface-100 text-surface-500 px-1.5 py-0.5 rounded font-bold">Optional</span>}
                              </h3>
                              <div className="text-sm text-surface-500 mt-1 flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {pos._count.candidates} candidate{pos._count.candidates !== 1 ? 's' : ''}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Link 
                                href={`/org/${orgSlug}/admin/e/${electionSlug}/setup/positions/${pos.id}/candidates`}
                                className="btn-secondary py-1.5 px-3 text-sm"
                              >
                                Manage Candidates
                              </Link>
                              
                              {!isLocked && (
                                <>
                                  <button onClick={() => setEditingPos(pos)} className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(pos)} disabled={isPending} className="p-2 text-surface-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
