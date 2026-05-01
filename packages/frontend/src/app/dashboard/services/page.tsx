"use client";

import { useEffect, useState } from "react";
import { servicesApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  currency: string;
  delivery_time_days: number;
  revisions: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", basePrice: "", deliveryTimeDays: "", revisions: "1",
  });

  const fetchServices = async () => {
    try {
      const { data } = await servicesApi.list();
      setServices(data.services || []);
    } catch { /* API not connected */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await servicesApi.create({
        name: formData.name,
        basePrice: parseFloat(formData.basePrice),
        description: formData.description || undefined,
        deliveryTimeDays: formData.deliveryTimeDays ? parseInt(formData.deliveryTimeDays) : undefined,
      });
      toast.success("Service created");
      setShowForm(false);
      setFormData({ name: "", description: "", basePrice: "", deliveryTimeDays: "", revisions: "1" });
      fetchServices();
    } catch { toast.error("Failed to create service"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Services & Pricing</h1>
          <p className="text-dark-400 mt-1">Your service catalog used by AI for proposals and negotiations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">Add Service</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Service</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Service Name *</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Base Price (USD) *</label>
              <input type="number" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} className="input" required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Delivery Time (days)</label>
              <input type="number" value={formData.deliveryTimeDays} onChange={(e) => setFormData({ ...formData, deliveryTimeDays: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Revisions</label>
              <input type="number" value={formData.revisions} onChange={(e) => setFormData({ ...formData, revisions: e.target.value })} className="input" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Create Service</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-dark-400 col-span-full text-center py-8">Loading...</p>
        ) : services.length === 0 ? (
          <p className="text-dark-400 col-span-full text-center py-8">No services yet. Add your first service above.</p>
        ) : (
          services.map((service) => (
            <div key={service.id} className="card">
              <h3 className="text-white font-medium text-lg">{service.name}</h3>
              <p className="text-dark-400 text-sm mt-1 line-clamp-2">{service.description || "No description"}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-dark-400 text-sm">Price</span>
                  <span className="text-primary-400 font-semibold">${service.base_price} {service.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400 text-sm">Delivery</span>
                  <span className="text-dark-200 text-sm">{service.delivery_time_days || "TBD"} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400 text-sm">Revisions</span>
                  <span className="text-dark-200 text-sm">{service.revisions}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => servicesApi.delete(service.id).then(fetchServices)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
