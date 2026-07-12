"use client";
import { toastConfirm } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Edit2, Trash2, AlertTriangle, Image as ImageIcon, X } from "lucide-react";
import { createCandidate, updateCandidate, deleteCandidate, reorderCandidates } from "@/app/actions/setup";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

type Candidate = {
  id: string;
  name: string;
  photoUrl: string | null;
  manifesto: string | null;
  order: number;
};

export default function CandidatesManager({ 
  electionId, 
  positionId,
  initialCandidates, 
  isLocked 
}: { 
  electionId: string;
  positionId: string;
  initialCandidates: Candidate[]; 
  isLocked: boolean;
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [isPending, setIsPending] = useState(false);
  const [editingCand, setEditingCand] = useState<Candidate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Candidate State
  const [newName, setNewName] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newManifesto, setNewManifesto] = useState("");
  
  const router = useRouter();

  const handleDragEnd = async (result: DropResult) => {
    if (isLocked) return;
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(candidates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    setCandidates(updatedItems);

    await reorderCandidates(electionId, positionId, updatedItems.map(i => ({ id: i.id, order: i.order })));
    router.refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isLocked) return;

    setIsPending(true);
    const res = await createCandidate(electionId, positionId, newName, newPhotoUrl, newManifesto);
    if (res.success) {
      setNewName("");
      setNewPhotoUrl("");
      setNewManifesto("");
      setIsAdding(false);
      router.refresh();
      window.location.reload(); 
    } else {
      toast.error(res.error || "Failed to add candidate");
    }
    setIsPending(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCand || !editingCand.name.trim() || isLocked) return;

    setIsPending(true);
    const res = await updateCandidate(electionId, editingCand.id, editingCand.name, editingCand.photoUrl || "", editingCand.manifesto || "");
    if (res.success) {
      setCandidates(candidates.map(c => c.id === editingCand.id ? { ...editingCand } : c));
      setEditingCand(null);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update candidate");
    }
    setIsPending(false);
  };

  const handleDelete = async (cand: Candidate) => {
    if (isLocked) return;
    if (!(await toastConfirm(`Are you sure you want to remove ${cand.name}?`))) return;

    setIsPending(true);
    const res = await deleteCandidate(electionId, cand.id);
    if (res.success) {
      setCandidates(candidates.filter(c => c.id !== cand.id));
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete candidate");
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
            <Plus className="w-4 h-4" /> Add Candidate
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm animate-scale-in">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">New Candidate</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="input-field"
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Photo (Optional)</label>
              {newPhotoUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={newPhotoUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-surface-200" />
                  <button type="button" onClick={() => setNewPhotoUrl("")} className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1 shadow-sm hover:bg-danger-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <CldUploadWidget 
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} 
                  onSuccess={(result: any) => {
                    setNewPhotoUrl(result?.info?.secure_url);
                  }}
                >
                  {({ open }) => (
                    <button type="button" onClick={() => open()} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Upload Photo
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Manifesto (Optional)</label>
              <textarea 
                value={newManifesto}
                onChange={(e) => setNewManifesto(e.target.value)}
                className="input-field min-h-[100px] py-2"
                placeholder="A brief statement..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary py-2 text-sm" disabled={isPending}>Cancel</button>
              <button type="submit" className="btn-primary py-2 text-sm" disabled={isPending || !newName.trim()}>Save Candidate</button>
            </div>
          </div>
        </form>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="candidates-list" isDropDisabled={isLocked}>
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="space-y-3"
            >
              {candidates.length === 0 && !isAdding ? (
                <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center text-surface-500 border-dashed">
                  No candidates added yet.
                </div>
              ) : (
                candidates.map((cand, index) => (
                  <Draggable key={cand.id} draggableId={cand.id} index={index} isDragDisabled={isLocked}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-xl border transition-all ${
                          snapshot.isDragging ? "border-primary-400 shadow-lg scale-[1.02] z-10" : "border-surface-200 shadow-sm"
                        }`}
                      >
                        {editingCand?.id === cand.id ? (
                          <form onSubmit={handleUpdate} className="p-4 space-y-4">
                            <input 
                              type="text" 
                              value={editingCand.name}
                              onChange={(e) => setEditingCand({...editingCand, name: e.target.value})}
                              required
                              className="input-field py-2"
                              placeholder="Name"
                            />
                            
                            <div className="flex items-center gap-4">
                              {editingCand.photoUrl ? (
                                <div className="relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={editingCand.photoUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-surface-200" />
                                  <button type="button" onClick={() => setEditingCand({...editingCand, photoUrl: ""})} className="absolute -top-1.5 -right-1.5 bg-danger-500 text-white rounded-full p-0.5 shadow-sm hover:bg-danger-600">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <CldUploadWidget 
                                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} 
                                  onSuccess={(result: any) => {
                                    setEditingCand({...editingCand, photoUrl: result?.info?.secure_url});
                                  }}
                                >
                                  {({ open }) => (
                                    <button type="button" onClick={() => open()} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                                      <ImageIcon className="w-3.5 h-3.5" /> Photo
                                    </button>
                                  )}
                                </CldUploadWidget>
                              )}
                            </div>

                            <textarea 
                              value={editingCand.manifesto || ""}
                              onChange={(e) => setEditingCand({...editingCand, manifesto: e.target.value})}
                              className="input-field min-h-[80px] py-2 text-sm"
                              placeholder="Manifesto..."
                            />

                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => setEditingCand(null)} className="btn-secondary py-1.5 px-3 text-sm" disabled={isPending}>Cancel</button>
                              <button type="submit" className="btn-primary py-1.5 px-3 text-sm" disabled={isPending || !editingCand.name.trim()}>Save</button>
                            </div>
                          </form>
                        ) : (
                          <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                            {!isLocked && (
                              <div {...provided.dragHandleProps} className="text-surface-400 hover:text-surface-700 transition-colors p-1 cursor-grab active:cursor-grabbing self-center md:self-auto hidden md:block">
                                <GripVertical className="w-5 h-5" />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 flex-1 w-full">
                              {cand.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cand.photoUrl} alt={cand.name} className="w-12 h-12 object-cover rounded-full border border-surface-200 flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center border border-surface-200 text-surface-400 flex-shrink-0">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-surface-900 leading-snug">{cand.name}</h3>
                                {cand.manifesto && (
                                  <p className="text-xs text-surface-500 line-clamp-1 mt-0.5">{cand.manifesto}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 self-end md:self-center mt-2 md:mt-0">
                              {!isLocked && (
                                <>
                                  <button onClick={() => setEditingCand(cand)} className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(cand)} disabled={isPending} className="p-2 text-surface-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50">
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
