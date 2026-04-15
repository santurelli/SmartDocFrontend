import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import StatisticheService from '../../services/StatisticheService';
import FattureService from '../../services/FattureService';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { FaFrownOpen, FaPaperPlane, FaMoneyBillWave, FaInbox, FaUsers, FaTruck, FaFileInvoice, FaEye } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [ultimeFatture, setUltimeFatture] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ultimeRes] = await Promise.all([
                    StatisticheService.getDatiGlobali(),
                    FattureService.getUltimeFatture()
                ]);
                setStats(statsRes.data.payload);
                setUltimeFatture(ultimeRes.data.payload || []);
            } catch (error) {
                console.error("Errore nel caricamento dei dati dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('it-IT').format(value || 0);
    };

    const getStatusFELabel = (status) => {
        switch (status) {
            case 'BO': return { label: 'Bozza', className: 'label-default' };
            case 'DI': return { label: 'Da inviare', className: 'label-warning' };
            case 'IN': return { label: 'Inviata', className: 'label-info' };
            case 'AC': return { label: 'Accettata', className: 'label-success' };
            case 'NS': return { label: 'Scartata', className: 'label-danger' };
            case 'RC': return { label: 'Consegnata', className: 'label-success' };
            case 'MC': return { label: 'Mancata cons.', className: 'label-warning' };
            case 'RF': return { label: 'Rifiutata', className: 'label-danger' };
            default: return { label: status, className: 'label-default' };
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Caricamento dashboard in corso...</div>;
    }

    // Prepara i dati per il grafico
    const chartData = stats?.venduto?.map((item, index) => {
        const pagam = stats.pagamenti && stats.pagamenti[index]
            ? stats.pagamenti[index].valore
            : 0;
        return {
            name: item.descrizione,
            fatturato: item.valore,
            incassato: pagam
        };
    }) || [];

    return (
        <div className="dashboard-container">
            <div className="row">
                <div className="col-lg-12">
                    <div id="content-header" className="clearfix">
                        <div className="pull-left">
                            <ol className="breadcrumb">
                                <li><NavLink to="/">Home</NavLink></li>
                                <li className="active"><span>Dashboard</span></li>
                            </ol>
                            <h1>Dashboard</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Infoboxes - KPI */}
            <div className="row">
                <div className="col-lg-3 col-sm-6 col-xs-12">
                    <div className="infographic-box colored emerald-bg">
                        <span className="icon-wrapper"><FaFrownOpen /></span>
                        <div className="info-content">
                            <span className="headline">Fatture insolute</span>
                            <span className="value">{stats?.totDaRicevere > 0 ? formatCurrency(stats.totDaRicevere) : '€ 0,00'}</span>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3 col-sm-6 col-xs-12">
                    <div className="infographic-box colored green-bg">
                        <span className="icon-wrapper"><FaPaperPlane /></span>
                        <div className="info-content">
                            <span className="headline">Fatture nel mese</span>
                            <span className="value">{formatNumber(stats?.numFattureMese)}</span>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3 col-sm-6 col-xs-12">
                    <div className="infographic-box colored red-bg">
                        <span className="icon-wrapper"><FaMoneyBillWave /></span>
                        <div className="info-content">
                            <span className="headline">Crediti da riscuotere</span>
                            <span className="value">{formatCurrency(stats?.totDaRicevere)}</span>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3 col-sm-6 col-xs-12">
                    <div className="infographic-box colored purple-bg">
                        <span className="icon-wrapper"><FaInbox /></span>
                        <div className="info-content">
                            <span className="headline">Pagamenti da fare</span>
                            <span className="value">{formatCurrency(stats?.totDaPagare)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Main Graph */}
                <div className="col-md-9">
                    <div className="main-box">
                        <header className="main-box-header">
                            <h2>Fatture & Incassi</h2>
                        </header>
                        <div className="main-box-body" style={{ height: '350px', padding: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `€${val / 1000}k`} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="top" align="right" height={36} />
                                    <Bar dataKey="fatturato" name="Fatturato" fill="#03a9f4" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Line type="monotone" dataKey="incassato" name="Incassato" stroke="#e84e40" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quick Stats side boxes */}
                <div className="col-md-3">
                    <div className="main-box">
                        <header className="main-box-header clearfix">
                            <h2>Statistiche</h2>
                        </header>
                        <div className="main-box-body clearfix">
                            <ul className="dashboard-stats-list">
                                <li>
                                    <div className="stats-item">
                                        <div className="stats-icon blue"><FaFileInvoice /></div>
                                        <div className="stats-info">
                                            <span className="stats-title">Note credito mese</span>
                                            <span className="stats-value">{formatCurrency(stats?.totNoteCredito)}</span>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="stats-item">
                                        <div className="stats-icon red"><FaFileInvoice /></div>
                                        <div className="stats-info">
                                            <span className="stats-title">Fatt. fornitore mese</span>
                                            <span className="stats-value">{formatCurrency(stats?.totFattureFornitore)}</span>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="stats-item">
                                        <div className="stats-icon green"><FaUsers /></div>
                                        <div className="stats-info">
                                            <span className="stats-title">Clienti Totali</span>
                                            <span className="stats-value">{formatNumber(stats?.totClienti)}</span>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="stats-item">
                                        <div className="stats-icon orange"><FaTruck /></div>
                                        <div className="stats-info">
                                            <span className="stats-title">Fornitori Totali</span>
                                            <span className="stats-value">{formatNumber(stats?.totFornitori)}</span>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Invoices Table */}
            <div className="row">
                <div className="col-lg-12">
                    <div className="main-box clearfix">
                        <header className="main-box-header">
                            <h2>Ultime fatture emesse</h2>
                            <div className="filter-block">
                                <NavLink to="/fatture" className="btn btn-primary">
                                    <FaEye /> Vedi tutte
                                </NavLink>
                            </div>
                        </header>
                        <div className="main-box-body clearfix">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Numero</th>
                                            <th>Data</th>
                                            <th>Cliente</th>
                                            <th className="text-center">Stato</th>
                                            <th className="text-center">Stato FE</th>
                                            <th className="text-right">Totale</th>
                                            <th className="text-center">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ultimeFatture.map((fattura) => (
                                            <tr key={fattura.idDocumento}>
                                                <td>
                                                    <NavLink to={`/fatture/${fattura.idDocumento}`}>
                                                        {fattura.numeroDocumento}
                                                    </NavLink>
                                                </td>
                                                <td>{fattura.dataDocumento}</td>
                                                <td>{fattura.soggetto}</td>
                                                <td className="text-center">
                                                    {fattura.totaleDaPagare > 0 ? (
                                                        fattura.totalePagato > 0 ?
                                                            <span className="label label-warning">Parz. pagata</span> :
                                                            <span className="label label-danger">Non pagata</span>
                                                    ) : (
                                                        <span className="label label-success">Pagata</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {fattura.flFatturaElettronica === 1 && fattura.statoFatturaElettronica && (
                                                        <span className={`label ${getStatusFELabel(fattura.statoFatturaElettronica).className}`}>
                                                            {getStatusFELabel(fattura.statoFatturaElettronica).label}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-right"><strong>{formatCurrency(fattura.totale)}</strong></td>
                                                <td className="text-center">
                                                    <NavLink to={`/fatture/${fattura.idDocumento}`} className="table-link" title="Visualizza">
                                                        <FaEye size={20} style={{ color: '#03a9f4' }} />
                                                    </NavLink>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
