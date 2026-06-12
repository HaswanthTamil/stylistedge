'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from './ImageUploader';

type PriceType = 'fixed' | 'range' | 'gender' | 'custom';

type GenderPrice = { male: number; female: number };
type RangePrice = [number, number];
type ServicePrice = number | RangePrice | GenderPrice | null;

interface Service {
  name: string;
  price: ServicePrice;
  priceType: PriceType;
  serviceId?: string;
}

interface Category {
  id: string;
  title: string;
  image: string;
  highlight: boolean;
  services: Service[];
}

interface Contact {
  person: string;
  phone: string;
  address: string;
}

interface Brand {
  name: string;
  tagline: string;
  heroImage?: string;
  contact: Contact;
}

export interface DailyTiming {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface Timings {
  default: {
    monday: DailyTiming;
    tuesday: DailyTiming;
    wednesday: DailyTiming;
    thursday: DailyTiming;
    friday: DailyTiming;
    saturday: DailyTiming;
    sunday: DailyTiming;
  };
  scheduled: {
    [date: string]: DailyTiming;
  };
}

interface Database {
  brand: Brand;
  categories: Category[];
  timings?: Timings;
}

const defaultDailyTiming = { open: '09:00', close: '17:00', isOpen: true };

const emptyDatabase: Database = {
  brand: {
    name: '',
    tagline: '',
    heroImage: '',
    contact: {
      person: '',
      phone: '',
      address: ''
    }
  },
  categories: [],
  timings: {
    default: {
      monday: { ...defaultDailyTiming },
      tuesday: { ...defaultDailyTiming },
      wednesday: { ...defaultDailyTiming },
      thursday: { ...defaultDailyTiming },
      friday: { ...defaultDailyTiming },
      saturday: { ...defaultDailyTiming },
      sunday: { ...defaultDailyTiming, isOpen: false },
    },
    scheduled: {}
  }
};

function createId() {
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function ensureServiceIds(categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    services: category.services.map((service) => ({
      ...service,
      serviceId: service.serviceId ?? createId()
    }))
  }));
}

function omitInternalKeys(key: string, value: any) {
  if (key === 'serviceId') {
    return undefined;
  }
  return value;
}

export default function AdminPage() {
  const router = useRouter();
  const [database, setDatabase] = useState<Database>(emptyDatabase);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
   const [bookings, setBookings] = useState<any[]>([]);
  const [top5, setTop5] = useState<{ phone: string; name: string; count: number }[]>([]);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideIsOpen, setOverrideIsOpen] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState('09:00');
  const [overrideClose, setOverrideClose] = useState('17:00');

  useEffect(() => {
    if (selectedCategoryId === 'bookings') {
      fetch('/api/admin/bookings')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBookings(data.bookings);
          }
        });
    }
    if (selectedCategoryId === 'analytics') {
      fetch('/api/admin/analytics')
        .then(res => res.json())
        .then(data => {
          if (data.success) setTop5(data.top5);
        });
    }
  }, [selectedCategoryId]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveDatabaseToServer = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(database, omitInternalKeys, 2)
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save', error);
      showToast('Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetch('/database.json?v=' + Date.now())
      .then((response) => response.json())
      .then((json: Database) => {
        if (!active) return;
        setDatabase({
          brand: {
            ...json.brand,
            heroImage: json.brand.heroImage || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1600"
          },
          categories: ensureServiceIds(json.categories),
          timings: json.timings || emptyDatabase.timings
        });
        setIsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setDatabase(emptyDatabase);
        setIsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedCategoryId('timings');
    }
  }, [selectedCategoryId]);

  const selectedCategoryIndex = useMemo(
    () => database.categories.findIndex((category) => category.id === selectedCategoryId),
    [database.categories, selectedCategoryId]
  );

  const selectedCategory = selectedCategoryIndex >= 0 ? database.categories[selectedCategoryIndex] : null;

  const updateDatabase = (updater: (current: Database) => Database) => {
    setDatabase((current) => updater(current));
  };

  const updateBrandField = (field: keyof Brand, value: string) => {
    updateDatabase((current) => ({
      ...current,
      brand: {
        ...current.brand,
        [field]: value
      }
    }));
  };

  const updateContactField = (field: keyof Contact, value: string) => {
    updateDatabase((current) => ({
      ...current,
      brand: {
        ...current.brand,
        contact: {
          ...current.brand.contact,
          [field]: value
        }
      }
    }));
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const addOverride = () => {
    if (!overrideDate) {
      alert('Please select a date.');
      return;
    }
    updateDatabase(current => {
      const timings = current.timings || {
        default: { ...emptyDatabase.timings!.default },
        scheduled: { ...emptyDatabase.timings!.scheduled }
      };
      const scheduled = timings.scheduled || {};
      return {
        ...current,
        timings: {
          ...timings,
          scheduled: {
            ...scheduled,
            [overrideDate]: {
              isOpen: overrideIsOpen,
              open: overrideOpen,
              close: overrideClose
            }
          }
        }
      };
    });
    setOverrideDate('');
  };

  const removeOverride = (dateKey: string) => {
    updateDatabase(current => {
      const timings = current.timings || {
        default: { ...emptyDatabase.timings!.default },
        scheduled: { ...emptyDatabase.timings!.scheduled }
      };
      const scheduled = { ...timings.scheduled };
      delete scheduled[dateKey];
      return {
        ...current,
        timings: {
          ...timings,
          scheduled
        }
      };
    });
  };

  const formatToDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const updateCategoryField = (field: keyof Omit<Category, 'id' | 'services'>, value: string | boolean) => {
    if (selectedCategoryIndex < 0) return;
    updateDatabase((current) => {
      const categories = current.categories.map((category, index) =>
        index === selectedCategoryIndex ? { ...category, [field]: value } : category
      );
      return { ...current, categories };
    });
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: createId(),
      title: 'New Category',
      image: '',
      highlight: false,
      services: []
    };

    updateDatabase((current) => ({
      ...current,
      categories: [...current.categories, newCategory]
    }));

    setSelectedCategoryId(newCategory.id);
  };

  const deleteCategory = (categoryId: string) => {
    updateDatabase((current) => {
      const categories = current.categories.filter((category) => category.id !== categoryId);
      return { ...current, categories };
    });

    setSelectedCategoryId((current) =>
      current === categoryId ? database.categories.filter((category) => category.id !== categoryId)[0]?.id ?? null : current
    );
  };

  const moveCategory = (categoryId: string, direction: number) => {
    updateDatabase((current) => {
      const index = current.categories.findIndex((category) => category.id === categoryId);
      if (index < 0) return current;
      const target = index + direction;
      if (target < 0 || target >= current.categories.length) return current;
      const categories = [...current.categories];
      const [moved] = categories.splice(index, 1);
      categories.splice(target, 0, moved);
      return { ...current, categories };
    });
  };

  const updateSelectedCategoryServices = (updater: (services: Service[]) => Service[]) => {
    if (selectedCategoryIndex < 0) return;
    updateDatabase((current) => {
      const categories = current.categories.map((category, index) =>
        index === selectedCategoryIndex ? { ...category, services: updater(category.services) } : category
      );
      return { ...current, categories };
    });
  };

  const addService = () => {
    if (selectedCategoryIndex < 0) return;
    const newService: Service = {
      name: 'New Service',
      priceType: 'fixed',
      price: 0,
      serviceId: createId()
    };

    updateSelectedCategoryServices((services) => [...services, newService]);
  };

  const deleteService = (serviceId: string) => {
    updateSelectedCategoryServices((services) => services.filter((service) => service.serviceId !== serviceId));
  };

  const moveService = (serviceId: string, direction: number) => {
    updateSelectedCategoryServices((services) => {
      const index = services.findIndex((service) => service.serviceId === serviceId);
      if (index < 0) return services;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= services.length) return services;
      const next = [...services];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const updateService = (serviceId: string, patch: Partial<Service>) => {
    updateSelectedCategoryServices((services) =>
      services.map((service) =>
        service.serviceId === serviceId
          ? {
              ...service,
              ...patch
            }
          : service
      )
    );
  };

  const updateServicePriceType = (serviceId: string, priceType: PriceType) => {
    const nextPrice: ServicePrice =
      priceType === 'fixed'
        ? 0
        : priceType === 'range'
        ? [0, 0]
        : priceType === 'gender'
        ? { male: 0, female: 0 }
        : null;

    updateService(serviceId, { priceType, price: nextPrice });
  };

  const downloadJSON = () => {
    const json = JSON.stringify(database, omitInternalKeys, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = 'database.json';
      downloadLinkRef.current.click();
      URL.revokeObjectURL(url);
    }
  };

const renderPriceInputs = (service: Service) => {
  const textStyle = { color: 'black' };
  const inputStyle = { color: 'black' };

  switch (service.priceType) {
    case 'fixed':
      return (
        <label className="fieldRow" style={textStyle}>
          Price:
          <input
            style={inputStyle}
            type="number"
            value={typeof service.price === 'number' ? service.price : 0}
            min={0}
            onChange={(event) =>
              updateService(service.serviceId ?? '', {
                price: Number(event.target.value)
              })
            }
          />
        </label>
      );

    case 'range': {
      const [start = 0, end = 0] = Array.isArray(service.price)
        ? service.price
        : [0, 0];

      return (
        <div style={textStyle}>
          <label className="fieldRow">
            From:
            <input
              style={inputStyle}
              type="number"
              value={start}
              min={0}
              onChange={(event) =>
                updateService(service.serviceId ?? '', {
                  price: [Number(event.target.value), end]
                })
              }
            />
          </label>

          <label className="fieldRow">
            To:
            <input
              style={inputStyle}
              type="number"
              value={end}
              min={0}
              onChange={(event) =>
                updateService(service.serviceId ?? '', {
                  price: [start, Number(event.target.value)]
                })
              }
            />
          </label>
        </div>
      );
    }

    case 'gender': {
      const genderPrice =
        typeof service.price === 'object' &&
        !Array.isArray(service.price) &&
        service.price !== null
          ? service.price
          : { male: 0, female: 0 };

      return (
        <div style={textStyle}>
          <label className="fieldRow">
            Male:
            <input
              style={inputStyle}
              type="number"
              value={genderPrice.male}
              min={0}
              onChange={(event) =>
                updateService(service.serviceId ?? '', {
                  price: {
                    male: Number(event.target.value),
                    female: genderPrice.female
                  }
                })
              }
            />
          </label>

          <label className="fieldRow">
            Female:
            <input
              style={inputStyle}
              type="number"
              value={genderPrice.female}
              min={0}
              onChange={(event) =>
                updateService(service.serviceId ?? '', {
                  price: {
                    male: genderPrice.male,
                    female: Number(event.target.value)
                  }
                })
              }
            />
          </label>
        </div>
      );
    }

    case 'custom':
      return (
        <div className="fieldRow" style={textStyle}>
          Custom price - set service as custom pricing.
        </div>
      );

    default:
      return null;
  }
};
  return (
    <div className="adminShell">
      <div className="sidebar">
        <div className="flex items-center gap-3 pb-4 mb-2 border-b border-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src="/logo.png" alt="Stylist Edge Logo" className="w-full h-full object-cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="font-serif-luxury text-sm font-semibold tracking-wider text-black">
            Admin Panel
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors py-2 rounded-lg text-sm font-medium mb-4"
        >
          Logout
        </button>
        <div className="categoryList">
          <div
            className={`categoryItem ${selectedCategoryId === 'timings' ? 'selected' : ''}`}
            onClick={() => selectCategory('timings')}
          >
            <div className="categoryLabel">Store Timings</div>
          </div>
          <div
            className={`categoryItem ${selectedCategoryId === 'bookings' ? 'selected' : ''}`}
            onClick={() => selectCategory('bookings')}
          >
            <div className="categoryLabel">Bookings</div>
          </div>
          <div
            className={`categoryItem ${selectedCategoryId === 'analytics' ? 'selected' : ''}`}
            onClick={() => selectCategory('analytics')}
          >
            <div className="categoryLabel">Analytics</div>
          </div>
          <div
            className={`categoryItem ${selectedCategoryId === 'website' ? 'selected' : ''}`}
            onClick={() => selectCategory('website')}
          >
            <div className="categoryLabel">Edit Website</div>
          </div>
        </div>
      </div>

      <div className="mainPanel">
        {toast && (
          <div className={`toast ${toast.type}`}>
            <span className="toastIcon">{toast.type === 'success' ? '✅' : '❌'}</span>
            {toast.message}
          </div>
        )}
        <div className="topHeader">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!['website', 'brand', 'timings', 'bookings', 'analytics'].includes(selectedCategoryId || '') && (
              <button
                type="button"
                onClick={() => selectCategory('website')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                title="Go back"
              >
                ←
              </button>
            )}
            <div className="headerTitle">
              {selectedCategoryId === 'website' && '🌐 Edit Website'}
              {selectedCategoryId === 'brand' && '🏪 Brand Settings'}
              {selectedCategoryId === 'timings' && '⏰ Store Timings'}
              {selectedCategoryId === 'bookings' && '📅 Customer Bookings'}
              {selectedCategoryId === 'analytics' && '📈 Analytics'}
              {!['website', 'brand', 'timings', 'bookings', 'analytics'].includes(selectedCategoryId || '') && `📁 ${selectedCategory?.title || 'Category'}`}
            </div>
          </div>
          <button
            className="saveButton"
            type="button"
            onClick={saveDatabaseToServer}
            disabled={isSaving}
          >
            {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>

        {selectedCategoryId === 'website' && (
          <>
            <div className="sectionBlock">
              <div className="sectionHeader">Brand Settings</div>
              <div className="fieldRow">
                <label>Hero Image</label>
                <ImageUploader
                  value={database.brand.heroImage || ''}
                  onChange={(url) => updateBrandField('heroImage', url)}
                />
              </div>
              <div className="fieldRow">
                <label>Name</label>
                <input
                  type="text"
                  value={database.brand.name}
                  onChange={(event) => updateBrandField('name', event.target.value)}
                />
              </div>
              <div className="fieldRow">
                <label>Tagline</label>
                <input
                  type="text"
                  value={database.brand.tagline}
                  onChange={(event) => updateBrandField('tagline', event.target.value)}
                />
              </div>
              <div className="fieldRow">
                <label>Contact</label>
                <input
                  type="text"
                  value={database.brand.contact.person}
                  onChange={(event) => updateContactField('person', event.target.value)}
                />
              </div>
              <div className="fieldRow">
                <label>Phone</label>
                <input
                  type="text"
                  value={database.brand.contact.phone}
                  onChange={(event) => updateContactField('phone', event.target.value)}
                />
              </div>
              <div className="fieldRow">
                <label>Address</label>
                <input
                  type="text"
                  value={database.brand.contact.address}
                  onChange={(event) => updateContactField('address', event.target.value)}
                />
              </div>
            </div>

            <div className="sectionBlock">
              <div className="sectionHeader">Categories</div>
              <div className="categoryList">
                {database.categories.map((category) => {
                  const isSelected = category.id === selectedCategoryId;
                  return (
                    <div
                      key={category.id}
                      className={`categoryItem ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectCategory(category.id)}
                    >
                      <div className="categoryLabel">{category.title || 'Untitled Category'}</div>
                      <div className="categoryControls">
                        <button type="button" onClick={(event) => { event.stopPropagation(); moveCategory(category.id, -1); }}>
                          ↑
                        </button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); moveCategory(category.id, 1); }}>
                          ↓
                        </button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); deleteCategory(category.id); }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="primaryButton" type="button" onClick={addCategory}>
                + Add Category
              </button>
            </div>
          </>
        )}

        {selectedCategoryId === 'timings' && (
          <>
            <div className="sectionBlock">
              <div className="sectionHeader">Default Weekly Timings</div>
              {database.timings?.default && Object.entries(database.timings.default).map(([day, timing]) => (
                <div key={day} className="fieldRow" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '100px', textTransform: 'capitalize', fontWeight: 'bold' }}>{day}</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={timing.isOpen}
                      onChange={(e) => updateDatabase(current => ({
                        ...current,
                        timings: {
                          ...current.timings!,
                          default: {
                            ...current.timings!.default,
                            [day]: { ...timing, isOpen: e.target.checked }
                          }
                        }
                      }))}
                      style={{ width: 'auto', minHeight: 'auto' }}
                    />
                    Open
                  </label>
                  {timing.isOpen && (
                    <>
                      <input
                        type="time"
                        value={timing.open}
                        onChange={(e) => updateDatabase(current => ({
                          ...current,
                          timings: {
                            ...current.timings!,
                            default: {
                              ...current.timings!.default,
                              [day]: { ...timing, open: e.target.value }
                            }
                          }
                        }))}
                        style={{ width: '120px' }}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={timing.close}
                        onChange={(e) => updateDatabase(current => ({
                          ...current,
                          timings: {
                            ...current.timings!,
                            default: {
                              ...current.timings!.default,
                              [day]: { ...timing, close: e.target.value }
                            }
                          }
                        }))}
                        style={{ width: '120px' }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="sectionBlock" style={{ marginTop: '20px' }}>
              <div className="sectionHeader">Date-Specific Timings Overrides</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={overrideDate}
                    onChange={(e) => setOverrideDate(e.target.value)}
                    style={{ width: '160px', color: 'black' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'black' }}>
                    <input
                      type="checkbox"
                      checked={overrideIsOpen}
                      onChange={(e) => setOverrideIsOpen(e.target.checked)}
                      style={{ width: 'auto', minHeight: 'auto' }}
                    />
                    Open
                  </label>
                  {overrideIsOpen && (
                    <>
                      <input
                        type="time"
                        value={overrideOpen}
                        onChange={(e) => setOverrideOpen(e.target.value)}
                        style={{ width: '120px', color: 'black' }}
                      />
                      <span style={{ color: 'black' }}>to</span>
                      <input
                        type="time"
                        value={overrideClose}
                        onChange={(e) => setOverrideClose(e.target.value)}
                        style={{ width: '120px', color: 'black' }}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={addOverride}
                    style={{
                      backgroundColor: '#111',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Override
                  </button>
                </div>

                {database.timings?.scheduled && Object.keys(database.timings.scheduled).length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'black' }}>Active Overrides:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(database.timings.scheduled).map(([dateKey, timing]) => (
                        <div key={dateKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f5f5f5', borderRadius: '4px' }}>
                          <span style={{ color: 'black' }}>
                            <strong>{formatToDDMMYYYY(dateKey)}</strong>: {timing.isOpen ? `${timing.open} - ${timing.close}` : 'Closed'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeOverride(dateKey)}
                            style={{
                              backgroundColor: '#ff4d4f',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {selectedCategoryId === 'bookings' && (
          <div className="sectionBlock">
            <div className="sectionHeader">Customer Bookings</div>
            {bookings.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'black' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '8px' }}>Date</th>
                    <th style={{ padding: '8px' }}>Time</th>
                    <th style={{ padding: '8px' }}>Name</th>
                    <th style={{ padding: '8px' }}>Phone</th>
                    <th style={{ padding: '8px' }}>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '8px' }}>{booking.date}</td>
                      <td style={{ padding: '8px' }}>{booking.time}</td>
                      <td style={{ padding: '8px' }}>{booking.name}</td>
                      <td style={{ padding: '8px' }}>{booking.phone}</td>
                      <td style={{ padding: '8px', textTransform: 'capitalize' }}>{booking.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="emptyState" style={{ color: 'black' }}>No bookings found.</div>
            )}
          </div>
        )}

        {selectedCategoryId === 'analytics' && (
          <div className="sectionBlock">
            <div className="sectionHeader">Top 5 Frequent Customers</div>
            {top5.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'black' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '8px' }}>#</th>
                    <th style={{ padding: '8px' }}>Name</th>
                    <th style={{ padding: '8px' }}>Phone</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.map((user, idx) => (
                    <tr key={user.phone} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: idx === 0 ? '#b8860b' : 'black' }}>{idx + 1}</td>
                      <td style={{ padding: '8px' }}>{user.name}</td>
                      <td style={{ padding: '8px' }}>{user.phone}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{user.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="emptyState" style={{ color: 'black' }}>No booking data found.</div>
            )}
          </div>
        )}

        {selectedCategoryId !== 'website' && selectedCategoryId !== 'timings' && selectedCategoryId !== 'bookings' && selectedCategoryId !== 'analytics' && (
        <div className="sectionBlock">
          <div className="sectionHeader">
            {selectedCategory ? selectedCategory.title : 'Select a Category'}
          </div>

          {selectedCategory ? (
            <>
              <div className="fieldRow">
                <label>Title</label>
                <input
                  type="text"
                  value={selectedCategory.title}
                  onChange={(event) => updateCategoryField('title', event.target.value)}
                />
              </div>
              <div className="fieldRow">
                <label>Category Image</label>
                <ImageUploader
                  value={selectedCategory.image}
                  onChange={(url) => updateCategoryField('image', url)}
                />
              </div>
              <div className="fieldRow checkboxRow">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedCategory.highlight}
                    onChange={(event) => updateCategoryField('highlight', event.target.checked)}
                  />
                  Highlight
                </label>
              </div>
              <div className="buttonGroup">
                <button type="button" onClick={() => deleteCategory(selectedCategory.id)}>
                  Delete Category
                </button>
              </div>

              <div className="sectionHeader">Services</div>
              <div className="servicesList">
                {selectedCategory.services.map((service) => (
                  <div key={service.serviceId} className="serviceBlock">
                    <div className="fieldRow">
                      <label>Name</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(event) => updateService(service.serviceId ?? '', { name: event.target.value })}
                      />
                    </div>
                    <div className="fieldRow">
                      <label>Price Type</label>
                      <select
                        value={service.priceType}
                        onChange={(event) => updateServicePriceType(service.serviceId ?? '', event.target.value as PriceType)}
                      >
                        <option value="fixed">fixed</option>
                        <option value="range">range</option>
                        <option value="gender">gender</option>
                        <option value="custom">custom</option>
                      </select>
                    </div>
                    <div className="priceBlock">{renderPriceInputs(service)}</div>
                    <div className="buttonGroup">
                      <button type="button" onClick={() => moveService(service.serviceId ?? '', -1)}>
                        ↑
                      </button>
                      <button type="button" onClick={() => moveService(service.serviceId ?? '', 1)}>
                        ↓
                      </button>
                      <button type="button" onClick={() => deleteService(service.serviceId ?? '')}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="primaryButton" type="button" onClick={addService}>
                + Add Service
              </button>
            </>
          ) : (
            <div className="emptyState">Choose a category from the sidebar to edit the services.</div>
          )}
        </div>
        )}

        <div className="sectionBlock">
          <button className="primaryButton" type="button" onClick={downloadJSON}>
            Download JSON
          </button>
        </div>
      </div>

      <a ref={downloadLinkRef} style={{ display: 'none' }} />

      <style jsx>{`
        :global(body) {
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }

        .adminShell {
          display: flex;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #f8fafc;
          color: #0f172a;
        }

        .sidebar {
          width: 280px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
          z-index: 10;
        }

        .sidebar .sectionHeader {
          color: #64748b;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 12px;
          margin-bottom: 4px;
        }

        .categoryList {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .categoryItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          color: #475569;
          font-weight: 500;
        }

        .categoryItem:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .categoryItem.selected {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.05);
        }

        .categoryLabel {
          flex: 1;
          margin-right: 10px;
          font-size: 0.95rem;
          line-height: 1.3;
        }

        .categoryControls button {
          margin-left: 4px;
          min-width: 28px;
          padding: 6px;
          border: none;
          border-radius: 6px;
          background: #e2e8f0;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .categoryControls button:hover {
          background: #cbd5e1;
          color: #0f172a;
        }

        .mainPanel {
          flex: 1;
          padding: 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          overflow-y: auto;
          position: relative;
        }

        .topHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 8px;
        }
        
        .headerTitle {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sectionBlock {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: box-shadow 0.3s ease;
        }
        
        .sectionBlock:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
        }

        .sectionHeader {
          font-size: 1.15rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 20px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 10px;
        }

        .fieldRow {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .fieldRow label {
          font-size: 0.90rem;
          font-weight: 600;
          color: #334155;
        }

        .fieldRow input,
        .fieldRow select,
        .priceBlock input,
        .priceBlock select {
          width: 100%;
          min-height: 44px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 0.95rem;
          background: #ffffff;
          color: #0f172a;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02) inset;
        }
        
        .fieldRow input:focus,
        .fieldRow select:focus,
        .priceBlock input:focus,
        .priceBlock select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .checkboxRow {
          flex-direction: row;
          align-items: center;
          padding: 8px 0;
        }

        .checkboxRow label {
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        
        .checkboxRow input[type="checkbox"] {
          width: 20px;
          height: 20px;
          accent-color: #2563eb;
          cursor: pointer;
        }

        .buttonGroup {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
        }

        .buttonGroup button,
        .primaryButton {
          border: none;
          border-radius: 10px;
          padding: 12px 20px;
          background: #f1f5f9;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .buttonGroup button:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .primaryButton {
          background: #1e293b;
          color: #ffffff;
          box-shadow: 0 4px 6px rgba(30, 41, 59, 0.2);
        }
        
        .primaryButton:hover {
          background: #0f172a;
          box-shadow: 0 6px 12px rgba(30, 41, 59, 0.3);
          transform: translateY(-1px);
        }

        .saveButton {
          background: #10b981;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        }
        
        .saveButton:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(16, 185, 129, 0.3);
        }
        
        .saveButton:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .servicesList {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .serviceBlock {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #f8fafc;
          transition: border-color 0.2s;
        }
        
        .serviceBlock:hover {
          border-color: #cbd5e1;
        }

        .priceBlock {
          display: grid;
          gap: 16px;
          margin-bottom: 12px;
          background: #ffffff;
          padding: 16px;
          border-radius: 8px;
          border: 1px dashed #cbd5e1;
        }

        .emptyState {
          color: #64748b;
          padding: 32px;
          text-align: center;
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          font-weight: 500;
        }
        
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          z-index: 1000;
          animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .toast.success {
          border-left: 4px solid #10b981;
          color: #064e3b;
        }
        
        .toast.error {
          border-left: 4px solid #ef4444;
          color: #7f1d1d;
        }
        
        .toastIcon {
          font-size: 1.2rem;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        th {
          background: #f1f5f9;
          padding: 12px 16px;
          font-weight: 600;
          color: #475569;
          text-align: left;
          font-size: 0.9rem;
          border-bottom: 1px solid #cbd5e1;
        }
        
        th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
        th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
        
        td {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 0.95rem;
        }
        
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f8fafc; }

        @media (max-width: 960px) {
          .adminShell {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .mainPanel {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}