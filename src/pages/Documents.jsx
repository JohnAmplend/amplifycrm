import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Upload, 
  FolderPlus, 
  Grid, 
  List, 
  Search, 
  File, 
  FileText, 
  Image, 
  Download,
  Trash2,
  Eye,
  Share2
} from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function Documents() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: folders = [] } = useQuery({
    queryKey: ['document_folders'],
    queryFn: () => base44.entities.Document_Folders.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', selectedFolder],
    queryFn: () => {
      if (selectedFolder) {
        return base44.entities.Documents_Library.filter({ folder_id: selectedFolder }, '-created_date');
      }
      return base44.entities.Documents_Library.list('-created_date');
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.Document_Folders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['document_folders']);
      setShowFolderForm(false);
      setNewFolderName("");
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      return base44.entities.Documents_Library.create({
        document_name: file.name,
        file_url: file_url,
        file_type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
        file_size: (file.size / (1024 * 1024)).toFixed(2),
        folder_id: selectedFolder,
        uploaded_by: currentUser?.email,
        is_public: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Documents_Library.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate({
        folder_name: newFolderName,
        created_by: currentUser?.email
      });
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('PDF')) return <FileText className="w-8 h-8" style={{ color: "#f5222d" }} />;
    if (fileType?.includes('DOC')) return <FileText className="w-8 h-8" style={{ color: "#4a90e2" }} />;
    if (fileType?.includes('XLS')) return <FileText className="w-8 h-8" style={{ color: "#52c41a" }} />;
    if (['PNG', 'JPG', 'JPEG', 'GIF'].includes(fileType)) return <Image className="w-8 h-8" style={{ color: "#fa8c16" }} />;
    return <File className="w-8 h-8" style={{ color: "#888" }} />;
  };

  const filteredDocuments = documents.filter(doc =>
    doc.document_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Documents
            </h1>
            <p style={{ color: "#888" }}>Manage your files and documents</p>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <NeuroButton onClick={() => document.getElementById('file-upload').click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => setShowFolderForm(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </NeuroButton>
          </div>
        </div>

        {showFolderForm && (
          <NeuroCard className="mb-6">
            <div className="flex items-center gap-3">
              <NeuroInput
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="flex-1"
              />
              <NeuroButton onClick={handleCreateFolder} disabled={!newFolderName.trim() || createFolderMutation.isLoading}>
                Create
              </NeuroButton>
              <NeuroButton onClick={() => { setShowFolderForm(false); setNewFolderName(""); }}>
                Cancel
              </NeuroButton>
            </div>
          </NeuroCard>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Folders */}
          <div>
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Folders
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`ampvibe-button w-full px-3 py-2 text-left ${!selectedFolder ? 'active' : ''}`}
                >
                  All Documents
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`ampvibe-button w-full px-3 py-2 text-left ${selectedFolder === folder.id ? 'active' : ''}`}
                  >
                    {folder.folder_name}
                  </button>
                ))}
              </div>
            </NeuroCard>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Toolbar */}
            <NeuroCard>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ampvibe-input w-full pl-12"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`ampvibe-button p-2 ${viewMode === "grid" ? "active" : ""}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`ampvibe-button p-2 ${viewMode === "list" ? "active" : ""}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </NeuroCard>

            {/* Documents */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <File className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
                    <p style={{ color: "#aaa" }}>No documents found</p>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <NeuroCard key={doc.id} className="hover:shadow-xl transition-shadow">
                      <div className="flex flex-col items-center p-4">
                        {getFileIcon(doc.file_type)}
                        <h3 className="font-medium mt-3 mb-1 text-center" style={{ color: "#666" }}>
                          {doc.document_name}
                        </h3>
                        <p className="text-xs mb-3" style={{ color: "#888" }}>
                          {doc.file_type} • {doc.file_size} MB
                        </p>
                        <div className="flex gap-2 w-full">
                          <NeuroButton
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Download className="w-3 h-3" />
                          </NeuroButton>
                          <NeuroButton
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Delete this document?')) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </NeuroButton>
                        </div>
                      </div>
                    </NeuroCard>
                  ))
                )}
              </div>
            ) : (
              <NeuroCard>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Name</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Type</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Size</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Uploaded</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b hover:bg-white hover:bg-opacity-50 transition-colors"
                          style={{ borderColor: "rgba(30, 58, 138, 0.05)" }}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {getFileIcon(doc.file_type)}
                              <span style={{ color: "#666" }}>{doc.document_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ color: "#888" }}>{doc.file_type}</td>
                          <td className="py-3 px-4" style={{ color: "#888" }}>{doc.file_size} MB</td>
                          <td className="py-3 px-4" style={{ color: "#888" }}>
                            {new Date(doc.created_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <NeuroButton
                                size="sm"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              >
                                <Download className="w-3 h-3" />
                              </NeuroButton>
                              <NeuroButton
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Delete this document?')) {
                                    deleteMutation.mutate(doc.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </NeuroButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </NeuroCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}