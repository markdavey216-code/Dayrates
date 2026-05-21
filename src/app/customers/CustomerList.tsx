"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, MoreVertical, Trash2, Edit, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { deleteCustomer, type CustomerFormData } from "./actions";
import CustomerForm from "./CustomerForm";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  is_cis_contractor: boolean;
  is_vat_registered: boolean;
  site_notes: string | null;
  created_at: string;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerFormData | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      
      const response = await fetch(`/api/customers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    
    try {
      await deleteCustomer(id);
      fetchCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
    setOpenMenuId(null);
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or postcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background text-sm"
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Customer List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? (
            <p>No customers found matching &ldquo;{searchQuery}&rdquo;</p>
          ) : (
            <>
              <Building2 className="mx-auto mb-3 opacity-50" size={40} />
              <p className="font-medium">No customers yet</p>
              <p className="text-sm mt-1">Add your first customer to get started</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-card border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{customer.name}</h3>
                    {customer.is_cis_contractor && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        CIS
                      </span>
                    )}
                    {customer.is_vat_registered && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                        VAT
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="mt-2 space-y-1">
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Mail size={14} />
                        <span className="truncate">{customer.email}</span>
                      </a>
                    )}
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone size={14} />
                        <span>{customer.phone}</span>
                      </a>
                    )}
                    {(customer.address_line1 || customer.city || customer.postcode) && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span className="truncate">
                          {[customer.address_line1, customer.address_line2, customer.city, customer.postcode]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={() => toggleMenu(customer.id)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === customer.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-popover border rounded-lg shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={() => {
                            setEditingCustomer(customer as unknown as CustomerFormData);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Site Notes Preview */}
              {customer.site_notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.site_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && <CustomerForm onCancel={closeForm} />}
      {editingCustomer && <CustomerForm customer={editingCustomer} onCancel={closeForm} />}
    </div>
  );
}