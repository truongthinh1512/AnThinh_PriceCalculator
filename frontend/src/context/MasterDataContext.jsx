import React, { createContext, useState, useEffect, useContext } from 'react';

const MasterDataContext = createContext();

export const useMasterData = () => useContext(MasterDataContext);

export const MasterDataProvider = ({ children }) => {
    const [laminations, setLaminations] = useState([]);
    const [windingSpecs, setWindingSpecs] = useState([]);
    const [accessories, setAccessories] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const [lamRes, windRes, accRes, cusRes] = await Promise.all([
                fetch('/api/catalog/ei-laminations'),
                fetch('/api/catalog/winding-specs'),
                fetch('/api/catalog/accessories'),
                fetch('/api/customers')
            ]);
            
            if (lamRes.ok) setLaminations(await lamRes.json());
            if (windRes.ok) setWindingSpecs(await windRes.json());
            if (accRes.ok) setAccessories(await accRes.json());
            if (cusRes.ok) setCustomers(await cusRes.json());
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    return (
        <MasterDataContext.Provider value={{
            laminations, setLaminations,
            windingSpecs, setWindingSpecs,
            accessories, setAccessories,
            customers, setCustomers,
            refreshData: fetchCatalog,
            loading
        }}>
            {children}
        </MasterDataContext.Provider>
    );
};
