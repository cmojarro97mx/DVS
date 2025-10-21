import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FileSystemItem } from './DashboardPage';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ViewGridIcon } from '../components/icons/ViewGridIcon';
import { ViewListIcon } from '../components/icons/ViewListIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { FileIcon } from '../components/icons/FileIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { DocumentPdfIcon } from '../components/icons/DocumentPdfIcon';
import { DocumentCsvIcon } from '../components/icons/DocumentCsvIcon';
import { PhotoIcon } from '../components/icons/PhotoIcon';
import { MoreVerticalIcon } from '../components/icons/MoreVerticalIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { XIcon } from '../components/icons/XIcon';
import { FolderPlusIcon } from '../components/icons/FolderPlusIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import NewFolderModal from '../components/NewFolderModal';
import { FolderOpenIcon } from '../components/icons/FolderOpenIcon';
import { Banner } from '../components/Banner';

type ViewMode = 'grid' | 'list';

interface FilesManagerPageProps {
  fileSystem: FileSystemItem[];
  onFileSystemUpdate: React.Dispatch<React.SetStateAction<FileSystemItem[]>>;
}

const FileTypeIcon: React.FC<{ fileType: string, className?: string }> = ({ fileType, className = "w-8 h-8 text-gray-500" }) => {
    if (fileType.startsWith('image/')) return <PhotoIcon className={className} />;
    if (fileType === 'application/pdf') return <DocumentPdfIcon className={className} />;
    if (fileType.includes('spreadsheet') || fileType.includes('csv')) return <DocumentCsvIcon className={className} />;
    if (fileType.startsWith('application/vnd.openxmlformats-officedocument') || fileType === 'application/msword') return <DocumentTextIcon className={className} />;
    return <FileIcon className={className} />;
};

const FilePreviewModal: React.FC<{ item: FileSystemItem | null, onClose: () => void }> = ({ item, onClose }) => {
    if (!item || item.type !== 'file' || !item.file) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = item.preview!;
        link.download = item.file!.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        <FileTypeIcon fileType={item.file.type} className="w-6 h-6 flex-shrink-0" />
                        <h3 className="text-lg font-bold text-gray-800 truncate">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                           <DownloadIcon className="w-5 h-5" /> Download
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                </header>
                <div className="flex-grow p-4 overflow-auto">
                    {item.file.type.startsWith('image/') ? (
                        <img src={item.preview} alt={item.name} className="max-w-full max-h-full mx-auto" />
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center">
                            <FileTypeIcon fileType={item.file.type} className="w-32 h-32 text-gray-300" />
                            <p className="mt-4 text-xl font-semibold text-gray-700">No preview available</p>
                            <div className="mt-6 text-sm space-y-2 text-left bg-gray-50 p-4 rounded-lg border">
                                <p><strong>Size:</strong> {(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <p><strong>Type:</strong> {item.file.type}</p>
                                <p><strong>Last Modified:</strong> {new Date(item.file.lastModified).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Breadcrumbs: React.FC<{ currentPath: {id: string | null, name: string}[], setCurrentFolderId: (id: string | null) => void }> = ({ currentPath, setCurrentFolderId }) => (
    <nav className="flex items-center text-sm font-medium text-gray-500">
        {currentPath.map((part, index) => (
            <React.Fragment key={part.id || 'root'}>
                <button 
                    onClick={() => setCurrentFolderId(part.id)}
                    className="hover:text-blue-600 disabled:hover:text-gray-500 disabled:cursor-default"
                    disabled={index === currentPath.length - 1}
                >
                    {part.name}
                </button>
                {index < currentPath.length - 1 && <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
            </React.Fragment>
        ))}
    </nav>
);

const ItemActions: React.FC<{
    item: FileSystemItem;
    setPreviewItem: (item: FileSystemItem | null) => void;
    setRenamingItemId: (id: string | null) => void;
    setItemToDelete: (item: FileSystemItem | null) => void;
}> = ({ item, setPreviewItem, setRenamingItemId, setItemToDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDownload = () => {
        if(item.type === 'file' && item.file) {
            const link = document.createElement('a');
            link.href = item.preview!;
            link.download = item.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div ref={menuRef} className="relative">
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="p-2 rounded-full text-gray-500 hover:bg-gray-200">
                <MoreVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-10 border border-gray-200">
                    {item.type === 'file' && <button onClick={() => { setPreviewItem(item); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><EyeIcon className="w-4 h-4 mr-3" /> Preview</button>}
                    <button onClick={() => { setRenamingItemId(item.id); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><EditIcon className="w-4 h-4 mr-3" /> Rename</button>
                    {item.type === 'file' && <button onClick={handleDownload} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><DownloadIcon className="w-4 h-4 mr-3" /> Download</button>}
                    <div className="border-t my-1"></div>
                    <button onClick={() => { setItemToDelete(item); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4 mr-3" /> Delete</button>
                </div>
            )}
        </div>
    );
};

const ListItem: React.FC<{ 
    item: FileSystemItem;
    renamingItemId: string | null;
    handleRenameItem: (id: string, newName: string) => void;
    setCurrentFolderId: (id: string | null) => void;
    setPreviewItem: (item: FileSystemItem | null) => void;
    setRenamingItemId: (id: string | null) => void;
    setItemToDelete: (item: FileSystemItem | null) => void;
}> = ({ item, renamingItemId, handleRenameItem, setCurrentFolderId, setPreviewItem, setRenamingItemId, setItemToDelete }) => {
    const isRenaming = renamingItemId === item.id;
    const [name, setName] = useState(item.name);

    useEffect(() => {
        setName(item.name);
    }, [item.name]);

    const onRename = () => {
        if (name.trim()) handleRenameItem(item.id, name.trim());
        else setName(item.name);
        setRenamingItemId(null);
    };
    
    const doubleClickHandler = () => {
        if (item.type === 'folder') setCurrentFolderId(item.id);
        else setPreviewItem(item);
    };

    const Icon = item.type === 'folder' 
        ? <FolderIcon className="w-6 h-6 text-yellow-500" />
        : <FileTypeIcon fileType={item.file!.type} className="w-6 h-6 text-gray-500" />;

    return (
        <div className="grid grid-cols-[auto,1fr,150px,100px,auto] items-center gap-4 px-4 py-2 border-b border-gray-200 last:border-b-0 hover:bg-blue-50/50 cursor-pointer" onDoubleClick={doubleClickHandler}>
            <div className="flex-shrink-0">{Icon}</div>
            <div className="truncate">
                 {isRenaming ? (
                    <input type="text" value={name} onChange={e => setName(e.target.value)} onBlur={onRename} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="w-full text-sm border-blue-500 ring-2 ring-blue-200 rounded-md p-1" autoFocus />
                ) : (
                    <p className="font-semibold text-sm text-gray-800 truncate" title={item.name}>{item.name}</p>
                )}
            </div>
            <p className="text-sm text-gray-500 truncate">{item.file ? new Date(item.file.lastModified).toLocaleDateString() : '—'}</p>
            <p className="text-sm text-gray-500 truncate text-right">{item.file ? `${(item.file.size / 1024).toFixed(1)} KB` : '—'}</p>
            <div><ItemActions item={item} setPreviewItem={setPreviewItem} setRenamingItemId={setRenamingItemId} setItemToDelete={setItemToDelete} /></div>
        </div>
    );
};

const GridItem: React.FC<{ 
    item: FileSystemItem;
    renamingItemId: string | null;
    handleRenameItem: (id: string, newName: string) => void;
    setCurrentFolderId: (id: string | null) => void;
    setPreviewItem: (item: FileSystemItem | null) => void;
    setRenamingItemId: (id: string | null) => void;
    setItemToDelete: (item: FileSystemItem | null) => void;
}> = ({ item, renamingItemId, handleRenameItem, setCurrentFolderId, setPreviewItem, setRenamingItemId, setItemToDelete }) => {
    const isRenaming = renamingItemId === item.id;
    const [name, setName] = useState(item.name);

    useEffect(() => {
        setName(item.name);
    }, [item.name]);

    const onRename = () => {
        if (name.trim()) handleRenameItem(item.id, name.trim());
        else setName(item.name);
        setRenamingItemId(null);
    };

    const Icon = item.type === 'folder' 
        ? <FolderIcon className="w-16 h-16 text-yellow-500" />
        : <FileTypeIcon fileType={item.file!.type} className="w-16 h-16 text-gray-500" />;
    
    const doubleClickHandler = () => {
        if (item.type === 'folder') setCurrentFolderId(item.id);
        else setPreviewItem(item);
    };

    return (
        <div className="relative rounded-xl border border-gray-200 group flex flex-col items-center p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all" onDoubleClick={doubleClickHandler}>
            <div className="relative h-24 flex items-center justify-center">
                {Icon}
            </div>
            {isRenaming ? (
                <input type="text" value={name} onChange={e => setName(e.target.value)} onBlur={onRename} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="mt-2 w-full text-center text-sm border-blue-500 ring-2 ring-blue-200 rounded-md" autoFocus />
            ) : (
                <p className="font-semibold text-sm text-gray-800 truncate w-full mt-2" title={item.name}>{item.name}</p>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ItemActions item={item} setPreviewItem={setPreviewItem} setRenamingItemId={setRenamingItemId} setItemToDelete={setItemToDelete} />
            </div>
        </div>
    );
};

const FilesManagerPage: React.FC<FilesManagerPageProps> = ({ fileSystem, onFileSystemUpdate }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState<FileSystemItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);
    const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentPath = useMemo(() => {
        const path = [{ id: null, name: 'Home' }];
        if (!currentFolderId) return path;

        let parentId = currentFolderId;
        const breadcrumbs = [];
        while (parentId) {
            const folder = fileSystem.find(item => item.id === parentId);
            if (folder) {
                breadcrumbs.unshift({ id: folder.id, name: folder.name });
                parentId = folder.parentId;
            } else {
                break;
            }
        }
        return [...path, ...breadcrumbs];
    }, [currentFolderId, fileSystem]);

    const currentItems = useMemo(() => {
        return fileSystem
            .filter(item => item.parentId === currentFolderId && (item.name.toLowerCase().includes(searchQuery.toLowerCase())))
            .sort((a, b) => {
                if (a.type === 'folder' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
    }, [fileSystem, currentFolderId, searchQuery]);
    
    const handleCreateFolder = (name: string) => {
        const newFolder: FileSystemItem = {
            id: `folder-${Date.now()}`,
            name,
            type: 'folder',
            parentId: currentFolderId,
        };
        onFileSystemUpdate(prev => [...prev, newFolder]);
    };

    const handleUploadFiles = (files: FileList) => {
        if (!files) return;
        const newFiles: FileSystemItem[] = Array.from(files).map(file => ({
            id: `file-${Date.now()}-${Math.random()}`,
            name: file.name,
            type: 'file',
            parentId: currentFolderId,
            file: file,
            preview: URL.createObjectURL(file),
        }));
        onFileSystemUpdate(prev => [...prev, ...newFiles]);
    };

    const handleDeleteItem = () => {
        if (!itemToDelete) return;

        let idsToDelete = [itemToDelete.id];
        if (itemToDelete.type === 'folder') {
            const findChildrenRecursive = (parentId: string) => {
                const children = fileSystem.filter(item => item.parentId === parentId);
                children.forEach(child => {
                    idsToDelete.push(child.id);
                    if (child.type === 'folder') {
                        findChildrenRecursive(child.id);
                    }
                });
            };
            findChildrenRecursive(itemToDelete.id);
        }
        
        onFileSystemUpdate(prev => prev.filter(item => !idsToDelete.includes(item.id)));
        setItemToDelete(null);
    };
    
    const handleRenameItem = (id: string, newName: string) => {
        onFileSystemUpdate(prev => prev.map(item => item.id === id ? { ...item, name: newName } : item));
        setRenamingItemId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) {
            handleUploadFiles(e.dataTransfer.files);
        }
    };

    return (
      <div className="animate-fade-in space-y-6">
        <Banner
            title="File Manager"
            description="Manage all your documents and folders."
            icon={FolderOpenIcon}
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center space-x-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                     <button onClick={() => setIsNewFolderModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <FolderPlusIcon className="w-5 h-5"/> New Folder
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        <UploadCloudIcon className="w-5 h-5"/> Upload Files
                    </button>
                    <input type="file" multiple ref={fileInputRef} onChange={e => e.target.files && handleUploadFiles(e.target.files)} className="hidden" />
                </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 mb-4 border-b pb-2">
                <Breadcrumbs currentPath={currentPath} setCurrentFolderId={setCurrentFolderId} />
                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/50'}`}><ViewGridIcon className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/50'}`}><ViewListIcon className="w-5 h-5" /></button>
                </div>
            </div>

            <div 
                className={`min-h-[400px] rounded-lg transition-colors duration-200 p-1 ${isDragOver ? 'bg-blue-50 border-blue-400 border-2 border-dashed' : 'bg-transparent'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {currentItems.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5">
                            {currentItems.map(item => <GridItem key={item.id} item={item} renamingItemId={renamingItemId} handleRenameItem={handleRenameItem} setCurrentFolderId={setCurrentFolderId} setPreviewItem={setPreviewItem} setRenamingItemId={setRenamingItemId} setItemToDelete={setItemToDelete} />)}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-200">
                             <div className="grid grid-cols-[auto,1fr,150px,100px,auto] gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                <div className="col-start-2">Name</div>
                                <div>Last Modified</div>
                                <div className="text-right">File Size</div>
                                <div></div>
                            </div>
                            <div className="bg-white rounded-b-xl">
                                {currentItems.map(item => <ListItem key={item.id} item={item} renamingItemId={renamingItemId} handleRenameItem={handleRenameItem} setCurrentFolderId={setCurrentFolderId} setPreviewItem={setPreviewItem} setRenamingItemId={setRenamingItemId} setItemToDelete={setItemToDelete} />)}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center text-gray-500 p-10 border-2 border-dashed border-gray-300 rounded-xl">
                        <UploadCloudIcon className="w-16 h-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-800">This folder is empty</h3>
                        <p className="mt-1 text-sm">
                            Drag and drop files here or{' '}
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none">
                                browse your computer
                            </button>
                        </p>
                    </div>
                )}
            </div>
            
            <NewFolderModal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} onCreate={handleCreateFolder} />
            <FilePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
            <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDeleteItem} title={`Delete ${itemToDelete?.type}`}>
                Are you sure you want to delete "{itemToDelete?.name}"? {itemToDelete?.type === 'folder' && 'All contents within this folder will also be deleted.'} This action cannot be undone.
            </ConfirmationModal>
        </div>
      </div>
    );
};

export default FilesManagerPage;