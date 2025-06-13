// src/components/ReceiptPDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Interfaces (sin cambios)
interface Orden {
  productos: { nombre: string; precio: number }[];
}

interface MesaBill {
  mesa: string;
  ordenes: Orden[];
  total: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 15,
    // Ancho de 58mm
    width: 164, 
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 8,
    marginBottom: 3,
  },
  table: {
    width: '100%',
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 8,
  },
  colQty: {
    width: '18%',
  },
  colDesc: {
    width: '57%',
  },
  colPrice: {
    width: '25%',
    textAlign: 'right',
  },
  line: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    marginVertical: 5,
  },
  total: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginTop: 5,
  },
  footer: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 15,
    color: 'grey',
  }
});

interface ReceiptPDFProps {
  bill: MesaBill;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ bill }) => {
    // Lógica para agrupar productos (sin cambios)
    const productosAgrupados: { [key: string]: { cantidad: number; precio: number } } = {};
    bill.ordenes.forEach(orden => {
        orden.productos.forEach(p => {
            if (!productosAgrupados[p.nombre]) {
                productosAgrupados[p.nombre] = { cantidad: 0, precio: p.precio };
            }
            productosAgrupados[p.nombre].cantidad += 1;
        });
    });

    return (
        <Document>
            {/* ===== CORRECCIÓN AQUÍ ===== */}
            {/* Se eliminó la propiedad 'size' para que la página se ajuste al contenido */}
            <Page style={styles.page}>
                <Text style={styles.title}>Terraza Madero</Text>
                <Text style={styles.subtitle}>PRE-CUENTA</Text>
                
                <View style={styles.line} />
                <Text style={styles.text}>Mesa: {bill.mesa}</Text>
                <Text style={styles.text}>Fecha: {new Date().toLocaleString('es-MX')}</Text>
                <View style={styles.line} />

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colQty}>Cant.</Text>
                        <Text style={styles.colDesc}>Descripcion</Text>
                        <Text style={styles.colPrice}>Total</Text>
                    </View>
                    {Object.entries(productosAgrupados).map(([nombre, item]) => (
                        <View key={nombre} style={styles.tableRow}>
                            <Text style={styles.colQty}>{item.cantidad}x</Text>
                            <Text style={styles.colDesc}>{nombre}</Text>
                            <Text style={styles.colPrice}>${(item.precio * item.cantidad).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.line} />
                <Text style={styles.total}>TOTAL: ${bill.total.toFixed(2)}</Text>
                
                <Text style={styles.footer}>Por favor, revise su cuenta.</Text>
            </Page>
        </Document>
    );
};

export default ReceiptPDF;