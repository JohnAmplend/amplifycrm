import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, BookOpen, Eye } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function KnowledgeBase() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    article_title: "",
    article_slug: "",
    article_content: "",
    category: "",
    is_published: false
  });

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['kb_articles'],
    queryFn: () => base44.entities.Knowledge_Base_Article.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingArticle) {
        return base44.entities.Knowledge_Base_Article.update(editingArticle.id, data);
      } else {
        return base44.entities.Knowledge_Base_Article.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kb_articles']);
      setShowForm(false);
      setEditingArticle(null);
      setFormData({
        article_title: "",
        article_slug: "",
        article_content: "",
        category: "",
        is_published: false
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Knowledge_Base_Article.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['kb_articles']);
    }
  });

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      article_title: article.article_title,
      article_slug: article.article_slug,
      article_content: article.article_content || "",
      category: article.category || "",
      is_published: article.is_published
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Auto-generate slug if not provided
    const slug = formData.article_slug || formData.article_title.toLowerCase().replace(/\s+/g, '-');
    saveMutation.mutate({ ...formData, article_slug: slug });
  };

  const filteredArticles = articles.filter(a =>
    a.article_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Knowledge Base
            </h1>
            <p style={{ color: "#888" }}>Self-service articles for your customers</p>
          </div>
          <NeuroButton variant="primary" onClick={() => { setShowForm(true); setEditingArticle(null); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </NeuroButton>
        </div>

        {showForm && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              {editingArticle ? 'Edit Article' : 'New Article'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <NeuroInput
                label="Article Title"
                value={formData.article_title}
                onChange={(e) => setFormData({ ...formData, article_title: e.target.value })}
                required
              />
              <NeuroInput
                label="URL Slug"
                value={formData.article_slug}
                onChange={(e) => setFormData({ ...formData, article_slug: e.target.value })}
                placeholder="auto-generated-from-title"
              />
              <NeuroInput
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Getting Started, FAQ"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#333" }}>
                  Content <span style={{ color: "#f5222d" }}>*</span>
                </label>
                <textarea
                  value={formData.article_content}
                  onChange={(e) => setFormData({ ...formData, article_content: e.target.value })}
                  className="ampvibe-input w-full min-h-[300px]"
                  placeholder="Write your article content..."
                  required
                />
              </div>
              <div className="ampvibe-inset p-4 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="ampvibe-button w-5 h-5"
                  />
                  <span style={{ color: "#666" }}>Publish article</span>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <NeuroButton type="button" onClick={() => { setShowForm(false); setEditingArticle(null); }}>
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : 'Save Article'}
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        )}

        {/* Search */}
        <NeuroCard className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ampvibe-input w-full pl-12"
            />
          </div>
        </NeuroCard>

        {/* Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12" style={{ color: "#aaa" }}>
              Loading articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No articles found</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Article
              </NeuroButton>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <NeuroCard key={article.id} className="hover:shadow-xl transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold" style={{ color: "#666" }}>
                      {article.article_title}
                    </h3>
                    <span className={`ampvibe-button px-2 py-1 text-xs ${
                      article.is_published ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {article.category && (
                    <span className="ampvibe-button px-2 py-1 text-xs">
                      {article.category}
                    </span>
                  )}
                  <p className="text-sm" style={{ color: "#888" }}>
                    {article.article_content?.substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "#aaa" }}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.view_count || 0}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                    <NeuroButton size="sm" className="flex-1" onClick={() => handleEdit(article)}>
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Delete this article?')) {
                          deleteMutation.mutate(article.id);
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
      </div>
    </div>
  );
}