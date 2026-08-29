import React, { useState, useEffect } from 'react';
import StatisticheService from '../../services/StatisticheService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { FaChartLine, FaTrophy, FaUsers, FaTruck, FaFileInvoiceDollar, FaBoxOpen } from 'react-icons/fa';
import './DashboardStatistichePage.css';

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const formatMoney = (val) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);

const dateStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
};

const KpiCard = ({ icon, label, value, color }) => (
    <div className="kpi-card">
        <div className="kpi-icon" style={{ backgroundColor: `${color}22`, color }}>{icon}</div>
        <div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{label}</div>
        </div>
    </div>
);

const DashboardStatistichePage = () => {
    const [loading, setLoading] = useState(true);
    const [globali, setGlobali] = useState(null);
    const [topClienti, setTopClienti] = useState([]);
    const [topProdotti, setTopProdotti] = useState([]);
    const [andamentoMensile, setAndamentoMensile] = useState([]);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const oggi = new Date();
            const annoCorrente = oggi.getFullYear();
            const inizioAnnoCorrente = new Date(annoCorrente, 0, 1);
            const inizioAnnoPrecedente = new Date(annoCorrente - 1, 0, 1);
            const fineAnnoPrecedente = new Date(annoCorrente - 1, 11, 31);

            const [globaliRes, clientiRes, prodottiRes, meseCorrenteRes, mesePrecedenteRes] = await Promise.all([
                StatisticheService.getDatiGlobali(),
                StatisticheService.getVendite({ dtDal: dateStr(inizioAnnoCorrente), dtAl: dateStr(oggi), raggruppa: 'CLIENTE', mostra: 'TOTALE_DOCUMENTO' }),
                StatisticheService.getVendite({ dtDal: dateStr(inizioAnnoCorrente), dtAl: dateStr(oggi), raggruppa: 'PRODOTTO', mostra: 'QUANTITA_PRODOTTI' }),
                StatisticheService.getVendite({ dtDal: dateStr(inizioAnnoCorrente), dtAl: dateStr(oggi), raggruppa: 'MESE', mostra: 'TOTALE_DOCUMENTO' }),
                StatisticheService.getVendite({ dtDal: dateStr(inizioAnnoPrecedente), dtAl: dateStr(fineAnnoPrecedente), raggruppa: 'MESE', mostra: 'TOTALE_DOCUMENTO' })
            ]);

            setGlobali(globaliRes.data?.payload || null);

            const clienti = (clientiRes.data?.payload || [])
                .slice().sort((a, b) => (b.valore || 0) - (a.valore || 0)).slice(0, 10)
                .map(c => ({ nome: c.descrizione, valore: c.valore }));
            setTopClienti(clienti);

            const prodotti = (prodottiRes.data?.payload || [])
                .slice().sort((a, b) => (b.valore || 0) - (a.valore || 0)).slice(0, 10)
                .map(p => ({ nome: p.descrizione, valore: p.valore }));
            setTopProdotti(prodotti);

            const byMonth = (list) => {
                const map = new Map();
                (list || []).forEach(item => {
                    const d = new Date(item.descrizione);
                    if (!isNaN(d)) map.set(d.getMonth(), item.valore);
                });
                return map;
            };
            const mapCorrente = byMonth(meseCorrenteRes.data?.payload);
            const mapPrecedente = byMonth(mesePrecedenteRes.data?.payload);
            const andamento = MESI.map((label, idx) => ({
                mese: label,
                [`${annoCorrente}`]: mapCorrente.get(idx) || 0,
                [`${annoCorrente - 1}`]: mapPrecedente.get(idx) || 0
            }));
            setAndamentoMensile(andamento);
        } catch (error) {
            console.error('Errore nel caricamento della dashboard statistiche:', error);
        } finally {
            setLoading(false);
        }
    };

    const annoCorrente = new Date().getFullYear();

    if (loading) {
        return <div className="dashboard-stat-loading">Caricamento dashboard...</div>;
    }

    return (
        <div className="dashboard-stat-container">
            <div className="dashboard-stat-header">
                <h2><FaChartLine style={{ marginRight: '10px' }} />Dashboard Statistiche</h2>
                <p className="section-description">Panoramica rapida dell'andamento dell'attività. Per analisi puntuali e filtri avanzati usa le pagine Vendite / Acquisti / Pagamenti.</p>
            </div>

            {globali && (
                <div className="kpi-row">
                    <KpiCard icon={<FaUsers />} label="Clienti attivi" value={globali.totClienti ?? '-'} color="#2563eb" />
                    <KpiCard icon={<FaTruck />} label="Fornitori attivi" value={globali.totFornitori ?? '-'} color="#7c3aed" />
                    <KpiCard icon={<FaFileInvoiceDollar />} label="Fatture questo mese" value={globali.numFattureMese ?? '-'} color="#059669" />
                    <KpiCard icon={<FaFileInvoiceDollar />} label="Da ricevere" value={formatMoney(globali.totDaRicevere)} color="#d97706" />
                </div>
            )}

            <div className="dashboard-widgets-grid">
                <div className="dashboard-widget">
                    <h3><FaChartLine /> Andamento mensile {annoCorrente} vs {annoCorrente - 1}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={andamentoMensile}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mese" />
                            <YAxis tickFormatter={(v) => new Intl.NumberFormat('it-IT', { notation: 'compact' }).format(v)} />
                            <Tooltip formatter={(v) => formatMoney(v)} />
                            <Legend />
                            <Line type="monotone" dataKey={`${annoCorrente}`} stroke="#2563eb" strokeWidth={2} />
                            <Line type="monotone" dataKey={`${annoCorrente - 1}`} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="dashboard-widget">
                    <h3><FaTrophy /> Top 10 Clienti (fatturato {annoCorrente})</h3>
                    {topClienti.length === 0 ? (
                        <div className="dashboard-widget-empty">Nessun dato disponibile per il periodo.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topClienti} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(v) => new Intl.NumberFormat('it-IT', { notation: 'compact' }).format(v)} />
                                <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => formatMoney(v)} />
                                <Bar dataKey="valore" fill="#2563eb" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="dashboard-widget dashboard-widget-wide">
                    <h3><FaBoxOpen /> Articoli più venduti (quantità, {annoCorrente})</h3>
                    {topProdotti.length === 0 ? (
                        <div className="dashboard-widget-empty">Nessun dato disponibile per il periodo.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={topProdotti}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="valore" fill="#059669" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardStatistichePage;
