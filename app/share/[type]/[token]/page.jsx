'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Folder, Image as ImageIcon, Video, FileText, Download, Share2,
    MapPin, User, Phone, Loader2, ExternalLink, ArrowLeft, Grid3X3, List
} from 'lucide-react';
import { getSharedFolder, getSharedAsset, formatBytes } from '@/lib/assets';

export default function SharedAssetPage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [viewMode, setViewMode] = useState('grid');

    const type = params?.type; // 'folder' or 'asset'
    const token = params?.token;

    useEffect(() => {
        const fetchData = async () => {
            if (!type || !token) {
                setError('Invalid share link');
                setLoading(false);
                return;
            }

            try {
                let result;
                if (type === 'folder') {
                    result = await getSharedFolder(token);
                } else {
                    result = await getSharedAsset(token);
                }

                if (result.success) {
                    setData(result.data);
                } else {
                    setError('This content is not available or has been unshared.');
                }
            } catch (err) {
                setError('Failed to load shared content');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type, token]);

    // Get file icon
    const getFileIcon = (fileType, size = 24) => {
        switch (fileType) {
            case 'image': return <ImageIcon size={size} className="text-blue-500" />;
            case 'video': return <Video size={size} className="text-purple-500" />;
            default: return <FileText size={size} className="text-orange-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#FE9200] animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading shared content...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Folder className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="font-bold text-gray-900 text-lg mb-2">Content Not Available</h1>
                    <p className="text-gray-500 text-sm mb-6">{error || 'This share link may have expired or been removed.'}</p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE9200] text-white rounded-xl font-bold hover:bg-[#E58300] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Go Home
                    </a>
                </div>
            </div>
        );
    }

    // Single Asset View
    if (type === 'asset') {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src="/yoombaa-logo.svg" alt="Yoombaa" className="h-8" />
                                <span className="text-sm text-gray-400">Shared Property Asset</span>
                            </div>
                            {data.agent && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#FFF2E5] flex items-center justify-center text-[#FE9200] font-bold text-sm">
                                        {data.agent.name?.charAt(0) || 'A'}
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-sm font-medium text-gray-900">{data.agent.name}</p>
                                        <p className="text-xs text-gray-500">Agent</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Asset Display */}
                <main className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {data.file_type === 'image' ? (
                            <img src={data.public_url} alt={data.file_name} className="w-full max-h-[70vh] object-contain bg-gray-100" />
                        ) : data.file_type === 'video' ? (
                            <video src={data.public_url} controls className="w-full max-h-[70vh]" />
                        ) : (
                            <div className="p-12 text-center">
                                {getFileIcon(data.file_type, 48)}
                                <p className="mt-4 font-bold text-gray-900">{data.file_name}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="font-bold text-gray-900">{data.file_name}</h1>
                                {data.folder && (
                                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <MapPin size={14} />
                                        {data.folder.name}{data.folder.location && ` • ${data.folder.location}`}
                                    </p>
                                )}
                            </div>
                            <a
                                href={data.public_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE9200] text-white rounded-xl font-bold hover:bg-[#E58300] transition-colors"
                            >
                                <Download size={16} />
                                Download
                            </a>
                        </div>
                    </div>

                    {/* Agent Contact */}
                    {data.agent?.phone && (
                        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Contact Agent</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
                                    <User className="w-6 h-6 text-[#FE9200]" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{data.agent.name}</p>
                                </div>
                                <a
                                    href={`tel:${data.agent.phone}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                                >
                                    <Phone size={16} />
                                    Call
                                </a>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // Folder View
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src="/yoombaa-logo.svg" alt="Yoombaa" className="h-8" />
                            <span className="text-sm text-gray-400">Shared Property</span>
                        </div>
                        {data.agent && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#FFF2E5] flex items-center justify-center text-[#FE9200] font-bold text-sm">
                                    {data.agent.name?.charAt(0) || 'A'}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{data.agent.name}</p>
                                    <p className="text-xs text-gray-500">Agent</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Property Info */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">{data.name}</h1>
                            {data.location && (
                                <p className="text-gray-500 flex items-center gap-2 mt-1">
                                    <MapPin size={16} />
                                    {data.location}
                                </p>
                            )}
                            {data.description && (
                                <p className="text-gray-600 mt-2">{data.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                                >
                                    <Grid3X3 size={18} className={viewMode === 'grid' ? 'text-[#FE9200]' : 'text-gray-500'} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                                >
                                    <List size={18} className={viewMode === 'list' ? 'text-[#FE9200]' : 'text-gray-500'} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assets Grid */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {!data.assets || data.assets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Folder className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-900">No files in this folder</p>
                        <p className="text-gray-500 text-sm mt-1">The agent hasn&apos;t added any files yet.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                        : 'space-y-3'
                    }>
                        {data.assets.map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => setSelectedAsset(asset)}
                                className={`bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors cursor-pointer ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''
                                    }`}
                            >
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className="aspect-square bg-gray-100 relative">
                                            {asset.file_type === 'image' && asset.public_url ? (
                                                <img src={asset.public_url} alt={asset.file_name} className="w-full h-full object-cover" />
                                            ) : asset.file_type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                                    <Video className="w-12 h-12 text-white/50" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {getFileIcon(asset.file_type, 32)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="font-medium text-gray-900 truncate text-sm">{asset.file_name}</p>
                                            <p className="text-[10px] text-gray-400">{formatBytes(asset.file_size)}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {asset.file_type === 'image' && asset.public_url ? (
                                                <img src={asset.public_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                getFileIcon(asset.file_type, 24)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate text-sm">{asset.file_name}</p>
                                            <p className="text-xs text-gray-500">{formatBytes(asset.file_size)}</p>
                                        </div>
                                        <ExternalLink size={16} className="text-gray-400" />
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Agent Contact */}
                {data.agent?.phone && (
                    <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Interested in this property?</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FFF2E5] flex items-center justify-center">
                                <User className="w-6 h-6 text-[#FE9200]" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{data.agent.name}</p>
                                <p className="text-sm text-gray-500">Property Agent</p>
                            </div>
                            <a
                                href={`tel:${data.agent.phone}`}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                            >
                                <Phone size={16} />
                                Call Agent
                            </a>
                        </div>
                    </div>
                )}
            </main>

            {/* Asset Preview Modal */}
            {selectedAsset && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedAsset(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                        onClick={() => setSelectedAsset(null)}
                    >
                        <span className="sr-only">Close</span>
                        ✕
                    </button>

                    <div className="max-w-4xl max-h-[80vh] w-full" onClick={e => e.stopPropagation()}>
                        {selectedAsset.file_type === 'image' ? (
                            <img src={selectedAsset.public_url} alt={selectedAsset.file_name} className="w-full h-full object-contain" />
                        ) : selectedAsset.file_type === 'video' ? (
                            <video src={selectedAsset.public_url} controls className="w-full h-full" />
                        ) : (
                            <div className="bg-white rounded-2xl p-8 text-center">
                                {getFileIcon(selectedAsset.file_type, 48)}
                                <p className="mt-4 font-bold text-gray-900">{selectedAsset.file_name}</p>
                                <p className="text-gray-500 mb-4">{formatBytes(selectedAsset.file_size)}</p>
                                <a
                                    href={selectedAsset.public_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE9200] text-white rounded-xl font-bold"
                                >
                                    <Download size={16} />
                                    Download
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-center">
                        <p className="text-white font-medium">{selectedAsset.file_name}</p>
                        <p className="text-white/60 text-sm">{formatBytes(selectedAsset.file_size)}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
