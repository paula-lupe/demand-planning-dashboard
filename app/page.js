'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [leadTimeDays, setLeadTimeDays] = useState(90)
  const [velocityDays, setVelocityDays] = useState(30)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/summary`, {
        params: {
          lead_time_days: leadTimeDays,
          velocity_days: velocityDays,
        },
      })
      setData(response.data)
      setError(null)
    } catch (err) {
      setError('Error al conectar con el backend. Verifica que Replit esté corriendo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSkus = async () => {
    setLoading(true)
    try {
      let url = `${apiUrl}/api/skus?lead_time_days=${leadTimeDays}&velocity_days=${velocityDays}`
      
      if (urgencyFilter !== 'all') {
        url += `&urgency=${urgencyFilter}`
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      const response = await axios.get(url)
      setData({ skus: response.data, filtered: true })
      setError(null)
    } catch (err) {
      setError('Error al filtrar SKUs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [leadTimeDays, velocityDays])

  const handleFilterClick = () => {
    fetchSkus()
  }

  const handleSync = async () => {
    try {
      await axios.post(`${apiUrl}/api/sync`)
      fetchData()
      alert('Datos sincronizados desde Shopify')
    } catch (err) {
      alert('Error al sincronizar')
    }
  }

  if (loading) return <div className="loading">Cargando datos...</div>
  if (error) return <div className="error">{error}</div>
  if (!data) return <div className="loading">Sin datos</div>

  const summary = data.summary || data
  const skus = data.skus || []

  return (
    <div className="container">
      <div className="header">
        <h1>📊 Demand Planning Dashboard</h1>
        <p className="store-info">Love Lust · {summary.store_name || 'lovelustcl.myshopify.com'}</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="label">SKUs Visibles</div>
          <div className="value">{summary.total_visible_skus || 0}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>de {summary.total_skus || 0}</div>
        </div>
        
        <div className="summary-card critical">
          <div className="label">🔴 Crítico</div>
          <div className="value">{summary.critical_count || 0}</div>
        </div>
        
        <div className="summary-card warning">
          <div className="label">🟡 Advertencia</div>
          <div className="value">{summary.warning_count || 0}</div>
        </div>
        
        <div className="summary-card ok">
          <div className="label">🟢 OK</div>
          <div className="value">{summary.ok_count || 0}</div>
        </div>

        <div className="summary-card negative">
          <div className="label">Stock Negativo</div>
          <div className="value">{summary.negative_stock_count || 0}</div>
        </div>

        <div className="summary-card">
          <div className="label">Sin Ventas (30d)</div>
          <div className="value">{summary.no_sales_count || 0}</div>
        </div>

        <div className="summary-card">
          <div className="label">Total a Comprar</div>
          <div className="value" style={{ fontSize: '24px', color: '#27ae60' }}>
            {summary.total_to_purchase_units || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>unidades</div>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Lead Time (días)</label>
          <input
            type="number"
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(Number(e.target.value))}
            min="1"
          />
        </div>

        <div className="filter-group">
          <label>Velocidad (últimos días)</label>
          <input
            type="number"
            value={velocityDays}
            onChange={(e) => setVelocityDays(Number(e.target.value))}
            min="1"
          />
        </div>

        <div className="filter-group">
          <label>Urgencia</label>
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            <option value="all">Todas</option>
            <option value="critical">Crítico</option>
            <option value="warning">Advertencia</option>
            <option value="ok">OK</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Buscar SKU/Producto</label>
          <input
            type="text"
            placeholder="ej: Lupe, LL0314..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="button-group">
          <button onClick={handleFilterClick}>🔍 Filtrar</button>
          <button onClick={handleSync} style={{ background: '#27ae60' }}>
            🔄 Sincronizar
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Variante</th>
              <th>Stock</th>
              <th>En Tránsito</th>
              <th>Disponible</th>
              <th>Vel/Día</th>
              <th>Días Inv</th>
              <th>Stockout</th>
              <th>Comprar</th>
              <th>Urgencia</th>
            </tr>
          </thead>
          <tbody>
            {skus.length > 0 ? (
              skus.map((sku, idx) => (
                <tr key={idx}>
                  <td><strong>{sku.sku}</strong></td>
                  <td>{sku.product_name}</td>
                  <td>{sku.variant_title || '—'}</td>
                  <td className={sku.stock < 0 ? 'stock-negative' : ''}>
                    {sku.stock}
                  </td>
                  <td>{sku.incoming || 0}</td>
                  <td>{sku.available}</td>
                  <td>{sku.daily_velocity?.toFixed(2) || 0}</td>
                  <td>{sku.inventory_days?.toFixed(0) || '—'}</td>
                  <td>{sku.stockout_date || '—'}</td>
                  <td style={{ fontWeight: 'bold', color: '#27ae60' }}>
                    {sku.recommended_purchase_qty || 0}
                  </td>
                  <td>
                    <span className={`urgency-badge ${sku.urgency}`}>
                      {sku.urgency === 'critical' && '🔴 CRÍTICO'}
                      {sku.urgency === 'warning' && '🟡 WARNING'}
                      {sku.urgency === 'ok' && '🟢 OK'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', color: '#999' }}>
                  No hay SKUs que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
        <p>Última sincronización: {new Date().toLocaleString('es-CL')}</p>
        <p>Los datos se cachean por 10 minutos. Usa "Sincronizar" para actualizar.</p>
      </div>
    </div>
  )
}
