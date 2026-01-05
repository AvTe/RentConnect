'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Folder, FolderPlus, Upload, Image as ImageIcon, Video, FileText,
    MoreVertical, Share2, Trash2, Edit2, X, Plus, Search, Grid3X3,
    List, ChevronRight, ExternalLink, Copy, Check, Loader2,
    HardDrive, ArrowLeft, Eye, Download, Link2, MapPin, Clock
} from 'lucide-react';
import { Button } from './ui/Button';
import {
    getAgentStorageUsage,
    getAgentFolders,
    createAssetFolder,
    updateAssetFolder,
    deleteAssetFolder,
    toggleFolderSharing,
    getAgentAssets,
    getFolderAssets,
    uploadAsset,
    deleteAsset,
    toggleAssetSharing,
    formatBytes
} from '@/lib/assets';

export const AgentAssets = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [folders, setFolders] = useState([]);
    const [assets, setAssets] = useState([]);
    const [storageUsage, setStorageUsage] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [copySuccess, setCopySuccess] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Drag and drop states
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverFolder, setDragOverFolder] = useState(null);
    const dragCounter = useRef(0);

    const fileInputRef = useRef(null);
    const agentId = currentUser?.uid || currentUser?.id;

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!agentId) return;
        setLoading(true);
        try {
            const [storageResult, foldersResult, assetsResult] = await Promise.all([
                getAgentStorageUsage(agentId),
                getAgentFolders(agentId),
                currentFolder ? getFolderAssets(currentFolder.id) : getAgentAssets(agentId, { limit: 20 })
            ]);

            if (storageResult.success) setStorageUsage(storageResult.data);
            if (foldersResult.success) setFolders(foldersResult.data);
            if (assetsResult.success) setAssets(assetsResult.data);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    }, [agentId, currentFolder]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Create folder
    const handleCreateFolder = async (folderData) => {
        const result = await createAssetFolder(agentId, folderData);
        if (result.success) {
            setFolders([result.data, ...folders]);
            setShowNewFolderModal(false);
        }
        return result;
    };

    // Delete folder
    const handleDeleteFolder = async (folderId) => {
        if (!confirm('Delete this property folder and all its assets?')) return;
        const result = await deleteAssetFolder(agentId, folderId);
        if (result.success) {
            setFolders(folders.filter(f => f.id !== folderId));
            if (currentFolder?.id === folderId) setCurrentFolder(null);
        }
    };

    // Upload files
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const totalFiles = files.length;
        let completed = 0;

        for (const file of files) {
            const result = await uploadAsset(agentId, currentFolder?.id, file);
            if (result.success) {
                setAssets(prev => [result.data, ...prev]);
            }
            completed++;
            setUploadProgress(Math.round((completed / totalFiles) * 100));
        }

        setUploading(false);
        setShowUploadModal(false);
        fetchData(); // Refresh storage usage
    };

    // Delete asset
    const handleDeleteAsset = async (assetId) => {
        if (!confirm('Delete this asset?')) return;
        const result = await deleteAsset(agentId, assetId);
        if (result.success) {
            setAssets(assets.filter(a => a.id !== assetId));
            setSelectedAsset(null);
            fetchData(); // Refresh storage
        }
    };

    // Toggle sharing
    const handleToggleShare = async (type, id, isShared) => {
        if (type === 'folder') {
            const result = await toggleFolderSharing(id, !isShared);
            if (result.success) {
                setFolders(folders.map(f => f.id === id ? { ...f, is_shared: !isShared } : f));
            }
        } else {
            const result = await toggleAssetSharing(id, !isShared);
            if (result.success) {
                setAssets(assets.map(a => a.id === id ? { ...a, is_shared: !isShared } : a));
            }
        }
    };

    // Copy share link
    const copyShareLink = (shareToken, type) => {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/share/${type}/${shareToken}`;
        navigator.clipboard.writeText(link);
        setCopySuccess(shareToken);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    // Filter items by search
    const filteredFolders = folders.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAssets = assets.filter(a =>
        a.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get file icon
    const getFileIcon = (fileType, size = 24) => {
        switch (fileType) {
            case 'image': return <ImageIcon size={size} className="text-blue-500" />;
            case 'video': return <Video size={size} className="text-purple-500" />;
            default: return <FileText size={size} className="text-orange-500" />;
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
            setDragOverFolder(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e, targetFolderId = null) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setDragOverFolder(null);
        dragCounter.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            // Use targetFolderId if provided, otherwise use currentFolder
            const folderId = targetFolderId || currentFolder?.id;
            await handleFileUploadToFolder(files, folderId);
        }
    };

    // Upload files to a specific folder
    const handleFileUploadToFolder = async (files, folderId) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const totalFiles = files.length;
        let completed = 0;

        for (const file of files) {
            const result = await uploadAsset(agentId, folderId, file);
            if (result.success) {
                // Only add to current view if uploading to current folder
                if (folderId === currentFolder?.id || (!folderId && !currentFolder)) {
                    setAssets(prev => [result.data, ...prev]);
                }
            }
            completed++;
            setUploadProgress(Math.round((completed / totalFiles) * 100));
        }

        setUploading(false);
        fetchData(); // Refresh storage usage
    };

    // Handle folder drag enter
    const handleFolderDragEnter = (e, folderId) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolder(folderId);
    };

    // Handle folder drop
    const handleFolderDrop = async (e, folderId) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setDragOverFolder(null);
        dragCounter.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await handleFileUploadToFolder(files, folderId);
        }
    };

    if (loading && !folders.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="space-y-6 relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Drag and Drop Overlay */}
            {isDragging && (
                <div className="fixed inset-0 bg-[#FE9200]/10 backdrop-blur-sm z-40 flex items-center justify-center pointer-events-none">
                    <div className="bg-white rounded-3xl border-2 border-dashed border-[#FE9200] p-12 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-[#FFF2E5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-10 h-10 text-[#FE9200]" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Drop files here</h3>
                        <p className="text-gray-500 font-medium">
                            {currentFolder ? `Upload to "${currentFolder.name}"` : 'Upload to My Assets'}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">My Assets</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage and share your property files</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowNewFolderModal(true)} variant="outline" size="sm">
                        <FolderPlus size={16} className="mr-2" />
                        New Property
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} className="bg-[#FE9200] hover:bg-[#E58300] text-white" size="sm">
                        <Upload size={16} className="mr-2" />
                        Upload
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                    />
                </div>
            </div>

            {/* Storage Usage Card */}
            {storageUsage && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Storage Meter */}
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <HardDrive className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Storage Used</p>
                                    <p className="text-xl font-black text-gray-900">
                                        {formatBytes(storageUsage.totalUsed)} <span className="text-gray-400 font-medium text-sm">/ {formatBytes(storageUsage.limit)}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${storageUsage.percentage > 80 ? 'bg-red-500' : storageUsage.percentage > 50 ? 'bg-amber-500' : 'bg-[#FE9200]'}`}
                                    style={{ width: `${storageUsage.percentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{formatBytes(storageUsage.remaining)} remaining</p>
                        </div>

                        {/* Asset Counts */}
                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                                    <ImageIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-lg font-black text-gray-900">{storageUsage.imageCount}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Images</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                                    <Video className="w-5 h-5 text-purple-600" />
                                </div>
                                <p className="text-lg font-black text-gray-900">{storageUsage.videoCount}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Videos</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                </div>
                                <p className="text-lg font-black text-gray-900">{storageUsage.documentCount}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Documents</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900"
                    />
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    >
                        <Grid3X3 size={18} className={viewMode === 'grid' ? 'text-[#FE9200]' : 'text-gray-500'} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    >
                        <List size={18} className={viewMode === 'list' ? 'text-[#FE9200]' : 'text-gray-500'} />
                    </button>
                </div>
            </div>

            {/* Breadcrumb */}
            {currentFolder && (
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => setCurrentFolder(null)}
                        className="flex items-center gap-1 text-gray-500 hover:text-[#FE9200] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        All Properties
                    </button>
                    <ChevronRight size={16} className="text-gray-300" />
                    <span className="font-bold text-gray-900">{currentFolder.name}</span>
                    {currentFolder.location && (
                        <span className="flex items-center gap-1 text-gray-500">
                            <MapPin size={12} />
                            {currentFolder.location}
                        </span>
                    )}
                </div>
            )}

            {/* Folders Grid */}
            {!currentFolder && filteredFolders.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Properties</h3>
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                        : 'space-y-2'
                    }>
                        {filteredFolders.map(folder => (
                            <FolderCard
                                key={folder.id}
                                folder={folder}
                                viewMode={viewMode}
                                onOpen={() => setCurrentFolder(folder)}
                                onShare={() => handleToggleShare('folder', folder.id, folder.is_shared)}
                                onCopyLink={() => copyShareLink(folder.share_token, 'folder')}
                                onDelete={() => handleDeleteFolder(folder.id)}
                                copySuccess={copySuccess === folder.share_token}
                                isDragOver={dragOverFolder === folder.id}
                                onDragEnter={(e) => handleFolderDragEnter(e, folder.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleFolderDrop(e, folder.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Assets Grid */}
            {(currentFolder || (!currentFolder && filteredAssets.length > 0)) && (
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        {currentFolder ? 'Files' : 'Recent Files'}
                    </h3>
                    {filteredAssets.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center hover:border-[#FE9200] transition-colors">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="font-bold text-gray-900 mb-1">No files yet</p>
                            <p className="text-sm text-gray-500 mb-4">Drag and drop files here, or click to upload</p>
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                                <Upload size={16} className="mr-2" />
                                Browse Files
                            </Button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'
                            : 'space-y-2'
                        }>
                            {filteredAssets.map(asset => (
                                <AssetCard
                                    key={asset.id}
                                    asset={asset}
                                    viewMode={viewMode}
                                    onPreview={() => setSelectedAsset(asset)}
                                    onShare={() => handleToggleShare('asset', asset.id, asset.is_shared)}
                                    onCopyLink={() => copyShareLink(asset.share_token, 'asset')}
                                    onDelete={() => handleDeleteAsset(asset.id)}
                                    copySuccess={copySuccess === asset.share_token}
                                    getFileIcon={getFileIcon}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!currentFolder && folders.length === 0 && assets.length === 0 && !loading && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center hover:border-[#FE9200] transition-colors">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Drop files to get started</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Drag and drop files here, or create a property folder first
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => setShowNewFolderModal(true)} variant="outline">
                            <FolderPlus size={16} className="mr-2" />
                            Create Property
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} className="bg-[#FE9200] hover:bg-[#E58300] text-white">
                            <Upload size={16} className="mr-2" />
                            Browse Files
                        </Button>
                    </div>
                </div>
            )}

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <NewFolderModal
                    onClose={() => setShowNewFolderModal(false)}
                    onCreate={handleCreateFolder}
                />
            )}

            {/* Asset Preview Modal */}
            {selectedAsset && (
                <AssetPreviewModal
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onDelete={() => handleDeleteAsset(selectedAsset.id)}
                    onShare={() => handleToggleShare('asset', selectedAsset.id, selectedAsset.is_shared)}
                    onCopyLink={() => copyShareLink(selectedAsset.share_token, 'asset')}
                />
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="fixed bottom-4 right-4 bg-white rounded-2xl border border-gray-200 p-4 shadow-lg w-72">
                    <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-5 h-5 text-[#FE9200] animate-spin" />
                        <span className="font-bold text-gray-900">Uploading...</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FE9200] rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}% complete</p>
                </div>
            )}
        </div>
    );
};

// Folder Card Component
const FolderCard = ({ folder, viewMode, onOpen, onShare, onCopyLink, onDelete, copySuccess, isDragOver, onDragEnter, onDragOver, onDrop }) => {
    const [showMenu, setShowMenu] = useState(false);

    if (viewMode === 'list') {
        return (
            <div
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${isDragOver
                    ? 'border-[#FE9200] border-2 bg-[#FFF9F0] scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDragOver ? 'bg-[#FFF2E5]' : 'bg-amber-50'
                    }`}>
                    {isDragOver ? (
                        <Upload className="w-6 h-6 text-[#FE9200]" />
                    ) : (
                        <Folder className="w-6 h-6 text-amber-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
                    <p className="font-bold text-gray-900 truncate">{folder.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                        {folder.location && <span className="flex items-center gap-1"><MapPin size={10} />{folder.location}</span>}
                        <span>{folder.assetCount || 0} files</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isDragOver && (
                        <span className="px-2 py-1 bg-[#FE9200] text-white text-[10px] font-bold rounded-full animate-pulse">
                            Drop here
                        </span>
                    )}
                    {folder.is_shared && !isDragOver && (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">Shared</span>
                    )}
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        {showMenu && (
                            <FolderMenu onClose={() => setShowMenu(false)} onShare={onShare} onCopyLink={onCopyLink} onDelete={onDelete} isShared={folder.is_shared} copySuccess={copySuccess} />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-2xl border p-4 transition-all group ${isDragOver
                ? 'border-[#FE9200] border-2 bg-[#FFF9F0] scale-[1.02] shadow-lg'
                : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div className="relative mb-3">
                <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-colors ${isDragOver ? 'bg-[#FFF2E5]' : 'bg-amber-50'
                        }`}
                    onClick={onOpen}
                >
                    {isDragOver ? (
                        <div className="text-center">
                            <Upload className="w-12 h-12 text-[#FE9200] mx-auto mb-2" />
                            <span className="text-xs font-bold text-[#FE9200]">Drop files</span>
                        </div>
                    ) : (
                        <Folder className="w-12 h-12 text-amber-500" />
                    )}
                </div>
                {folder.is_shared && !isDragOver && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                        Shared
                    </span>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                            <MoreVertical size={14} className="text-gray-500" />
                        </button>
                        {showMenu && (
                            <FolderMenu onClose={() => setShowMenu(false)} onShare={onShare} onCopyLink={onCopyLink} onDelete={onDelete} isShared={folder.is_shared} copySuccess={copySuccess} />
                        )}
                    </div>
                </div>
            </div>
            <div className="cursor-pointer" onClick={onOpen}>
                <p className="font-bold text-gray-900 truncate text-sm">{folder.name}</p>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    {folder.location && <><MapPin size={10} />{folder.location}</>}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{folder.assetCount || 0} files</p>
            </div>
        </div>
    );
};

// Folder Menu
const FolderMenu = ({ onClose, onShare, onCopyLink, onDelete, isShared, copySuccess }) => {
    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => onClose();
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [onClose]);

    return (
        <div
            className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => { onShare(); onClose(); }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
            >
                <Share2 size={16} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium">{isShared ? 'Disable Sharing' : 'Enable Sharing'}</span>
            </button>
            {isShared && (
                <button
                    onClick={() => { onCopyLink(); }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                >
                    {copySuccess ? (
                        <Check size={16} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                        <Link2 size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span className="font-medium">{copySuccess ? 'Link Copied!' : 'Copy Share Link'}</span>
                </button>
            )}
            <div className="border-t border-gray-100 my-1" />
            <button
                onClick={() => { onDelete(); onClose(); }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3"
            >
                <Trash2 size={16} className="flex-shrink-0" />
                <span className="font-medium">Delete</span>
            </button>
        </div>
    );
};

// Asset Card Component
const AssetCard = ({ asset, viewMode, onPreview, onShare, onCopyLink, onDelete, copySuccess, getFileIcon }) => {
    const [showMenu, setShowMenu] = useState(false);

    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {asset.file_type === 'image' && asset.public_url ? (
                        <img src={asset.public_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        getFileIcon(asset.file_type, 24)
                    )}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={onPreview}>
                    <p className="font-bold text-gray-900 truncate text-sm">{asset.file_name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(asset.file_size)}</p>
                </div>
                <div className="flex items-center gap-2">
                    {asset.is_shared && (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">Shared</span>
                    )}
                    <button onClick={onPreview} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Eye size={16} className="text-gray-400" />
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        {showMenu && (
                            <FolderMenu onClose={() => setShowMenu(false)} onShare={onShare} onCopyLink={onCopyLink} onDelete={onDelete} isShared={asset.is_shared} copySuccess={copySuccess} />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors group">
            <div className="relative aspect-square bg-gray-100 cursor-pointer" onClick={onPreview}>
                {asset.file_type === 'image' && asset.public_url ? (
                    <img src={asset.public_url} alt={asset.file_name} className="w-full h-full object-cover" />
                ) : asset.file_type === 'video' && asset.public_url ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video className="w-12 h-12 text-white/50" />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {getFileIcon(asset.file_type, 32)}
                    </div>
                )}
                {asset.is_shared && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                        Shared
                    </span>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                            <MoreVertical size={14} className="text-gray-500" />
                        </button>
                        {showMenu && (
                            <FolderMenu onClose={() => setShowMenu(false)} onShare={onShare} onCopyLink={onCopyLink} onDelete={onDelete} isShared={asset.is_shared} copySuccess={copySuccess} />
                        )}
                    </div>
                </div>
            </div>
            <div className="p-3">
                <p className="font-medium text-gray-900 truncate text-xs">{asset.file_name}</p>
                <p className="text-[10px] text-gray-400">{formatBytes(asset.file_size)}</p>
            </div>
        </div>
    );
};

// New Folder Modal
const NewFolderModal = ({ onClose, onCreate }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', location: '', description: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setLoading(true);
        await onCreate(formData);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Create Property Folder</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Property Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900"
                            placeholder="e.g., 2BR Apartment Westlands"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900"
                            placeholder="e.g., Westlands, Nairobi"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FE9200] bg-white text-gray-900 h-24 resize-none"
                            placeholder="Brief description of the property..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1 bg-[#FE9200] hover:bg-[#E58300] text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FolderPlus size={16} className="mr-2" />}
                            Create
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Asset Preview Modal
const AssetPreviewModal = ({ asset, onClose, onDelete, onShare, onCopyLink }) => {
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={onShare} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <Share2 size={20} />
                </button>
                <a href={asset.public_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <ExternalLink size={20} />
                </a>
                <button onClick={onDelete} className="p-3 bg-white/10 hover:bg-red-500/50 rounded-xl text-white">
                    <Trash2 size={20} />
                </button>
                <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="max-w-4xl max-h-[80vh] w-full">
                {asset.file_type === 'image' ? (
                    <img src={asset.public_url} alt={asset.file_name} className="w-full h-full object-contain" />
                ) : asset.file_type === 'video' ? (
                    <video src={asset.public_url} controls className="w-full h-full" />
                ) : (
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="font-bold text-gray-900 mb-2">{asset.file_name}</p>
                        <p className="text-gray-500 mb-4">{formatBytes(asset.file_size)}</p>
                        <a href={asset.public_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE9200] text-white rounded-xl font-bold">
                            <Download size={16} />
                            Download
                        </a>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white font-medium">{asset.file_name}</p>
                <p className="text-white/60 text-sm">{formatBytes(asset.file_size)}</p>
            </div>
        </div>
    );
};

export default AgentAssets;
