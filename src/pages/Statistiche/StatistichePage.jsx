import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatisticheService from '../../services/StatisticheService';
import ClientiService from '../../services/ClientiService';
import FornitoriService from '../../services/FornitoriService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { FaChartBar, FaTable, FaFileExcel, FaFilter, FaSearch, FaSyncAlt } from 'react-icons/fa';
import Select from 'react-select';
import Swal from 'sweetalert2';

const StatistichePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const type = location.pathname.split('/').pop(); // vendite, acquisti, pagamenti

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [filters, setFilters] = useState({
        dtDal: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 1st Jan of current year
        dtAl: new Date().toISOString().split('T')[0],
        raggruppa: 'MESE',
        mostra: 'IMPONIBILE',
        soggetto: null
    });

    const [viewMode, setViewMode] = useState('chart'); // chart, table
    const [chartType, setChartType] = useState('bar'); // bar, line, area, pie

    const raggruppamentoOptions = [
        { value: 'MESE', label: 'Mensile' },
        { value: 'GIORNO', label: 'Giornaliero' },
        { value: 'TRIMESTRE', label: 'Trimestrale' },
        { value: 'ANNOTEMPORALE', label: 'Annuale' },
        { value: 'CLIENTE', label: 'Cliente', hidden: type !== 'vendite' },
        { value: 'FORNITORE', label: 'Fornitore', hidden: type !== 'acquisti' },
        { value: 'AGENTE', label: 'Agente', hidden: type === 'pagamenti' },
        { value: 'PRODOTTO', label: 'Prodotto', hidden: type === 'pagamenti' },
        { value: 'CATEGORIA_PRODOTTO', label: 'Categoria Prodotto', hidden: type === 'pagamenti' },
        { value: 'SOTTOCATEGORIA_PRODOTTO', label: 'Sottocategoria Prodotto', hidden: type === 'pagamenti' },
        { value: 'DIVISIONE', label: 'Divisione' },
        { value: 'PAGAMENTO', label: 'Modalità Pagamento' },
        { value: 'CITTA', label: 'Città', hidden: type === 'pagamenti' },
        { value: 'PROVINCIA', label: 'Provincia', hidden: type === 'pagamenti' },
        { value: 'NAZIONE', label: 'Nazione', hidden: type === 'pagamenti' },
        { value: 'TIPO_DOCUMENTO', label: 'Tipo Documento', hidden: type === 'pagamenti' },
    ].filter(o => !o.hidden);

    const mostraOptions = [
        { value: 'IMPONIBILE', label: 'Imponibile (€)' },
        { value: 'IVA', label: 'IVA (€)' },
        { value: 'TOTALE_DOCUMENTO', label: 'Totale (€)' },
        { value: 'NUMERO_DOCUMENTI', label: 'Numero Documenti' },
        { value: 'QUANTITA_PRODOTTI', label: 'Quantità Prodotti', hidden: type === 'pagamenti' },
        { value: 'IMPORTO_PRODOTTI', label: 'Importo Prodotti (€)', hidden: type === 'pagamenti' },
        { value: 'MARGINALITA', label: 'Marginalità (€)', hidden: type !== 'vendite' },
        { value: 'RICARICO', label: 'Ricarico (%)', hidden: type !== 'vendite' },
    ].filter(o => !o.hidden);

    useEffect(() => {
        fetchSubjects();
        fetchData();
        // Reset filters when type changes
        setFilters(prev => ({
            ...prev,
            raggruppa: 'MESE',
            mostra: type === 'pagamenti' ? 'IMPONIBILE' : 'IMPONIBILE',
            soggetto: null
        }));
    }, [type]);

    const formatDateForBackend = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const fetchSubjects = async () => {
        try {
            let res;
            if (type === 'vendite') {
                res = await ClientiService.getList({ length: 9999 });
                const list = res.data?.list || [];
                setSubjects(list.map(c => ({ value: c.id, label: c.denominazione })));
            } else if (type === 'acquisti') {
                res = await FornitoriService.getListForCombo();
                const list = res.data || res || [];
                setSubjects(list.map(f => ({ value: f.id, label: f.denominazione })));
            } else if (type === 'pagamenti') {
                const [cRes, fRes] = await Promise.all([
                    ClientiService.getList({ length: 9999 }),
                    FornitoriService.getListForCombo()
                ]);
                const cList = cRes.data?.list || [];
                const fList = fRes.data || fRes || [];
                const combined = [
                    ...cList.map(c => ({ value: `C-${c.id}`, label: `(C) ${c.denominazione}` })),
                    ...fList.map(f => ({ value: `F-${f.id}`, label: `(F) ${f.denominazione}` }))
                ];
                setSubjects(combined);
            }
        } catch (err) {
            console.error("Error fetching subjects:", err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            const params = {
                dtDal: formatDateForBackend(filters.dtDal),
                dtAl: formatDateForBackend(filters.dtAl),
                raggruppa: filters.raggruppa,
                mostra: filters.mostra,
            };

            if (type === 'vendite') {
                params.cliente = filters.soggetto?.value;
                res = await StatisticheService.getVendite(params);
            } else if (type === 'acquisti') {
                params.fornitore = filters.soggetto?.value;
                res = await StatisticheService.getAcquisti(params);
            } else if (type === 'pagamenti') {
                params.soggetto = filters.soggetto?.value;
                res = await StatisticheService.getPagamenti(params);
            }

            setData(res.data.payload || []);
        } catch (err) {
            console.error("Error fetching stats:", err);
            Swal.fire('Errore', 'Impossibile recuperare i dati statistici', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    const exportToExcel = () => {
        if (data.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        if (type === 'pagamenti') {
            csvContent += "Descrizione;Entrate;Uscite;Saldo\n";
            data.forEach(row => {
                csvContent += `${row.key};${row.entrate};${row.uscite};${row.saldo}\n`;
            });
        } else {
            const metricLabel = mostraOptions.find(o => o.value === filters.mostra)?.label || 'Valore';
            csvContent += `Descrizione;${metricLabel}\n`;
            data.forEach(row => {
                csvContent += `${row.descrizione};${row.valore}\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `statistiche_${type}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderChart = () => {
        if (data.length === 0) return <div className="no-data">Nessun dato disponibile per i filtri selezionati</div>;

        const chartData = type === 'pagamenti' 
            ? data.map(d => ({ name: d.key, entrate: d.entrate, uscite: d.uscite, saldo: d.saldo }))
            : data.map(d => ({ name: d.descrizione, valore: d.valore }));

        const metricLabel = mostraOptions.find(o => o.value === filters.mostra)?.label || 'Valore';

        if (type === 'pagamenti') {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(val) => `€${val}`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="entrate" fill="#82ca9d" name="Entrate" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="uscite" fill="#ff7300" name="Uscite" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="saldo" stroke="#0088FE" name="Saldo" strokeWidth={2} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === 'bar') {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => filters.mostra.includes('IMPORTO') || filters.mostra.includes('IMPONIBILE') || filters.mostra === 'IVA' || filters.mostra === 'TOTALE_DOCUMENTO' || filters.mostra === 'MARGINALITA' ? formatCurrency(value) : value} />
                        <Bar dataKey="valore" fill="#3498db" name={metricLabel} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === 'line') {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="valore" stroke="#3498db" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name={metricLabel} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === 'area') {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="valore" stroke="#3498db" fillOpacity={1} fill="url(#colorVal)" name={metricLabel} />
                    </AreaChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === 'pie') {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="valore"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
    };

    return (
        <div id="statistiche-page" className="page-content">
            <div className="main-box">
                <header className="main-box-header clearfix">
                    <h2 className="pull-left">Statistiche {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                    <div className="pull-right header-actions">
                        <button className={`btn btn-default ${viewMode === 'chart' ? 'active' : ''}`} onClick={() => setViewMode('chart')}>
                            <FaChartBar /> Grafico
                        </button>
                        <button className={`btn btn-default ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                            <FaTable /> Tabella
                        </button>
                        <button className="btn btn-primary" onClick={exportToExcel} disabled={data.length === 0}>
                            <FaFileExcel /> Esporta CSV
                        </button>
                    </div>
                </header>

                <div className="main-box-body clearfix">
                    <div className="filters-row row">
                        <div className="col-md-2 form-group">
                            <label>Da:</label>
                            <input type="date" className="form-control" value={filters.dtDal} onChange={(e) => handleFilterChange('dtDal', e.target.value)} />
                        </div>
                        <div className="col-md-2 form-group">
                            <label>A:</label>
                            <input type="date" className="form-control" value={filters.dtAl} onChange={(e) => handleFilterChange('dtAl', e.target.value)} />
                        </div>
                        <div className="col-md-2 form-group">
                            <label>Raggruppa per:</label>
                            <select className="form-control" value={filters.raggruppa} onChange={(e) => handleFilterChange('raggruppa', e.target.value)}>
                                {raggruppamentoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2 form-group">
                            <label>Cosa mostrare:</label>
                            <select className="form-control" value={filters.mostra} onChange={(e) => handleFilterChange('mostra', e.target.value)}>
                                {mostraOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3 form-group">
                            <label>{type === 'vendite' ? 'Cliente' : type === 'acquisti' ? 'Fornitore' : 'Soggetto'}:</label>
                            <Select
                                options={subjects}
                                isClearable
                                placeholder="Tutti..."
                                value={filters.soggetto}
                                onChange={(val) => handleFilterChange('soggetto', val)}
                                classNamePrefix="react-select"
                            />
                        </div>
                        <div className="col-md-1 form-group btn-search-col">
                            <label>&nbsp;</label>
                            <button className="btn btn-success btn-block" onClick={fetchData} title="Aggiorna">
                                <FaSyncAlt />
                            </button>
                        </div>
                    </div>

                    <div className="content-area">
                        {loading ? (
                            <div className="loading-spinner">Caricamento in corso...</div>
                        ) : (
                            viewMode === 'chart' ? (
                                <div className="chart-container">
                                    <div className="chart-type-selector text-center mb-3">
                                        <div className="btn-group">
                                            <button className={`btn btn-sm btn-default ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>Barre</button>
                                            <button className={`btn btn-sm btn-default ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>Linee</button>
                                            <button className={`btn btn-sm btn-default ${chartType === 'area' ? 'active' : ''}`} onClick={() => setChartType('area')}>Area</button>
                                            <button className={`btn btn-sm btn-default ${chartType === 'pie' ? 'active' : ''}`} onClick={() => setChartType('pie')}>Torta</button>
                                        </div>
                                    </div>
                                    {renderChart()}
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover">
                                        <thead>
                                            {type === 'pagamenti' ? (
                                                <tr>
                                                    <th>Descrizione</th>
                                                    <th className="text-right">Entrate</th>
                                                    <th className="text-right">Uscite</th>
                                                    <th className="text-right">Saldo</th>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th>Descrizione</th>
                                                    <th className="text-right">{mostraOptions.find(o => o.value === filters.mostra)?.label}</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody>
                                            {data.map((row, idx) => (
                                                type === 'pagamenti' ? (
                                                    <tr key={idx}>
                                                        <td>{row.key}</td>
                                                        <td className="text-right text-success">{formatCurrency(row.entrate)}</td>
                                                        <td className="text-right text-danger">{formatCurrency(row.uscite)}</td>
                                                        <td className={`text-right ${row.saldo >= 0 ? 'text-success' : 'text-danger'}`}>
                                                            <strong>{formatCurrency(row.saldo)}</strong>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr key={idx}>
                                                        <td>{row.descrizione}</td>
                                                        <td className="text-right">
                                                            {filters.mostra.includes('IMPORTO') || filters.mostra.includes('IMPONIBILE') || filters.mostra === 'IVA' || filters.mostra === 'TOTALE_DOCUMENTO' || filters.mostra === 'MARGINALITA' 
                                                                ? formatCurrency(row.valore) 
                                                                : filters.mostra === 'RICARICO' ? `${row.valore.toFixed(2)}%` : row.valore}
                                                        </td>
                                                    </tr>
                                                )
                                            ))}
                                            {data.length === 0 && (
                                                <tr>
                                                    <td colSpan={type === 'pagamenti' ? 4 : 2} className="text-center">Nessun dato trovato</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {data.length > 0 && type !== 'pagamenti' && !filters.mostra.includes('PREZZO') && filters.mostra !== 'RICARICO' && (
                                            <tfoot>
                                                <tr>
                                                    <td><strong>TOTALE</strong></td>
                                                    <td className="text-right">
                                                        <strong>
                                                            {filters.mostra.includes('IMPORTO') || filters.mostra.includes('IMPONIBILE') || filters.mostra === 'IVA' || filters.mostra === 'TOTALE_DOCUMENTO' || filters.mostra === 'MARGINALITA'
                                                                ? formatCurrency(data.reduce((acc, curr) => acc + curr.valore, 0))
                                                                : data.reduce((acc, curr) => acc + curr.valore, 0)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .page-content { padding: 20px; }
                .main-box { background: #fff; border-radius: 3px; margin-bottom: 20px; box-shadow: 0 1px 1px rgba(0,0,0,0.1); }
                .main-box-header { padding: 15px 20px; border-bottom: 1px solid #f0f0f0; }
                .main-box-header h2 { margin: 0; font-size: 1.5em; color: #34495e; }
                .main-box-body { padding: 20px; }
                .filters-row { margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #eef; }
                .btn-search-col { display: flex; flex-direction: column; }
                .header-actions { display: flex; gap: 10px; }
                .chart-container { min-height: 450px; padding: 20px; }
                .chart-type-selector { margin-bottom: 20px; }
                .loading-spinner { padding: 50px; text-align: center; color: #7f8c8d; font-style: italic; }
                .no-data { padding: 50px; text-align: center; color: #e74c3c; border: 1px dashed #ccc; border-radius: 5px; }
                .form-group label { font-weight: 600; font-size: 0.85em; color: #7f8c8d; margin-bottom: 5px; }
            `}} />
        </div>
    );
};

export default StatistichePage;
