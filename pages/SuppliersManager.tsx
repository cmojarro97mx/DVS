import React, { useState, useMemo } from 'react';
import { Supplier, Project } from './DashboardPage';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { SupplierPanel } from '../components/SupplierPanel';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TagIcon } from '../components/icons/TagIcon';
import SupplierDetailPanel from '../components/SupplierDetailPanel';
import { BuildingStorefrontIcon } from '../components/icons/BuildingStorefrontIcon';
import { Banner } from '../components/Banner';

interface SuppliersManagerProps {
    suppliers: Supplier[];
    projects: Project[];
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    onUpdateSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (supplierId: string) => void;
}

const SupplierCard: React.FC<{ supplier: Supplier, onViewDetails: () => void }> = ({ supplier, onViewDetails }) => (
    <div onClick={onViewDetails} className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-gray-800 text-lg">{supplier.name}</h3>
                <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1"><TagIcon className="w-4 h-4" />{supplier.category}</p>
            </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
            <p>{supplier.contactPerson}</p>
            <p className="truncate">{supplier.email}</p>
        </div>
    </div>
);

const SuppliersManager: React.FC<SuppliersManagerProps> = ({ suppliers, projects, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) => {
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<Supplier | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [suppliers, searchQuery]);

    const handleAddNew = () => {
        setSupplierToEdit(null);
        setIsEditPanelOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setSupplierToEdit(supplier);
        setSelectedSupplierForDetail(null);
        setIsEditPanelOpen(true);
    };

    const handleViewDetails = (supplier: Supplier) => {
        setSelectedSupplierForDetail(supplier);
    };

    const handleSave = (supplierData: Omit<Supplier, 'id'>) => {
        if (supplierToEdit) {
            onUpdateSupplier({ ...supplierData, id: supplierToEdit.id });
        } else {
            onAddSupplier(supplierData);
        }
        setIsEditPanelOpen(false);
    };
    
    const handleDeleteRequest = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
    };
    
    const confirmDelete = () => {
        if(supplierToDelete) {
            onDeleteSupplier(supplierToDelete.id);
            setSupplierToDelete(null);
            setSelectedSupplierForDetail(null);
        }
    };
    
    const operationalSummary = useMemo(() => {
        if (!selectedSupplierForDetail) return { total: 0, active: 0, completed: 0 };
        const supplierProjects = projects.filter(p => p.supplierIds?.includes(selectedSupplierForDetail.id));
        return {
            total: supplierProjects.length,
            active: supplierProjects.filter(p => p.status !== 'Delivered' && p.status !== 'Canceled').length,
            completed: supplierProjects.filter(p => p.status === 'Delivered').length,
        };
    }, [selectedSupplierForDetail, projects]);

    return (
        <div className="animate-fade-in space-y-6">
             <Banner
                title="Suppliers"
                description="Manage your network of vendors and partners."
                icon={BuildingStorefrontIcon}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search supplier..." className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Supplier
                    </button>
                </div>

                {filteredSuppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map(supplier => (
                            <SupplierCard key={supplier.id} supplier={supplier} onViewDetails={() => handleViewDetails(supplier)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-gray-50/75 border border-gray-200 rounded-xl py-20 flex flex-col items-center justify-center">
                        <div className="bg-gray-200 rounded-full p-5">
                            <BuildingStorefrontIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="mt-6 text-lg font-semibold text-gray-800">No Suppliers Found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by adding your first supplier.</p>
                    </div>
                )}
            </div>
            
            <SupplierPanel 
                isOpen={isEditPanelOpen}
                onClose={() => setIsEditPanelOpen(false)}
                onSave={handleSave}
                supplierToEdit={supplierToEdit}
            />

            {selectedSupplierForDetail && (
                <SupplierDetailPanel
                    supplier={selectedSupplierForDetail}
                    onClose={() => setSelectedSupplierForDetail(null)}
                    onEdit={() => handleEdit(selectedSupplierForDetail)}
                    onDelete={() => handleDeleteRequest(selectedSupplierForDetail)}
                    operationalSummary={operationalSummary}
                />
            )}

            <ConfirmationModal
                isOpen={!!supplierToDelete}
                onClose={() => setSupplierToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Supplier"
            >
                Are you sure you want to delete supplier "{supplierToDelete?.name}"? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default SuppliersManager;