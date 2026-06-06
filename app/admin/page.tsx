'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  contact: Contact;
}

interface Database {
  brand: Brand;
  categories: Category[];
}

const emptyDatabase: Database = {
  brand: {
    name: '',
    tagline: '',
    contact: {
      person: '',
      phone: '',
      address: ''
    }
  },
  categories: []
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
  const [database, setDatabase] = useState<Database>(emptyDatabase);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/database.json')
      .then((response) => response.json())
      .then((json: Database) => {
        if (!active) return;
        setDatabase({
          brand: json.brand,
          categories: ensureServiceIds(json.categories)
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
    if (!selectedCategoryId && database.categories.length > 0) {
      setSelectedCategoryId(database.categories[0].id);
    }
  }, [database.categories, selectedCategoryId]);

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

      <div className="mainPanel">
        <div className="sectionBlock">
          <div className="sectionHeader">Brand</div>
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
                <label>Image</label>
                <input
                  type="text"
                  value={selectedCategory.image}
                  onChange={(event) => updateCategoryField('image', event.target.value)}
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
                <button type="button" onClick={() => moveCategory(selectedCategory.id, -1)}>
                  Move Up
                </button>
                <button type="button" onClick={() => moveCategory(selectedCategory.id, 1)}>
                  Move Down
                </button>
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

        <div className="sectionBlock">
          <button className="primaryButton" type="button" onClick={downloadJSON}>
            Download JSON
          </button>
        </div>
      </div>

      <a ref={downloadLinkRef} style={{ display: 'none' }} />

      <style jsx>{`
        .adminShell {
          display: flex;
          min-height: 100vh;
          font-family: Arial, sans-serif;
          background: #f4f5f7;
        }

        .sidebar {
          width: 280px;
          background: #1e1e1e;
          color: #ffffff;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
        }

        .sidebar .sectionHeader {
          color: #ffffff;
        }

        .sectionHeader {
          font-size: 1rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 10px;
        }

        .categoryList {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .categoryItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          background: #2a2a2a;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .categoryItem:hover {
          background: #333333;
        }

        .categoryItem.selected {
          background: #444bff;
        }

        .categoryLabel {
          flex: 1;
          margin-right: 10px;
          font-size: 0.95rem;
          line-height: 1.3;
        }

        .categoryControls button {
          margin-left: 6px;
          min-width: 28px;
          padding: 6px;
          border: none;
          border-radius: 4px;
          background: #f4f5f7;
          color: #1e1e1e;
          cursor: pointer;
        }

        .mainPanel {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow-y: auto;
        }

        .sectionBlock {
          background: #ffffff;
          border: 1px solid #d9d9d9;
          border-radius: 12px;
          padding: 18px;
        }

        .fieldRow {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .fieldRow,
        .priceBlock label,
        .serviceBlock label {
          color: #000000;
        }

        .fieldRow label {
          font-size: 0.90rem;
          font-weight: 600;
        }

        .fieldRow input,
        .fieldRow select,
        .priceBlock input,
        .priceBlock select {
          width: 100%;
          min-height: 36px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #c4c4c4;
          font-size: 0.95rem;
          background: #ffffff;
          color: #111111;
        }

        .fieldRow input::placeholder,
        .fieldRow select::placeholder,
        .priceBlock input::placeholder,
        .priceBlock select::placeholder {
          color: #858585;
        }

        .priceBlock label,
        .serviceBlock label,
        .fieldRow label {
          color: #000000;
        }

        .checkboxRow {
          flex-direction: row;
          align-items: center;
        }

        .checkboxRow label {
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .buttonGroup {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }

        .buttonGroup button,
        .primaryButton {
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          background: #1e1e1e;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .buttonGroup button:hover,
        .primaryButton:hover {
          background: #333333;
        }

        .primaryButton {
          width: fit-content;
        }

        .servicesList {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 14px;
        }

        .serviceBlock {
          border: 1px solid #e1e1e1;
          border-radius: 10px;
          padding: 14px;
          background: #fafafa;
        }

        .priceBlock {
          display: grid;
          gap: 10px;
          margin-bottom: 10px;
        }

        .emptyState {
          color: #666666;
          padding: 18px;
          border: 1px dashed #cccccc;
          border-radius: 10px;
        }

        @media (max-width: 960px) {
          .adminShell {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
