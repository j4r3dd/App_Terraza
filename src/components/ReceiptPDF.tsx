// src/components/ReceiptPDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Interfaces
interface Orden {
  productos: { nombre: string; precio: number }[];
}

interface MesaBill {
  mesa: string;
  ordenes: Orden[];
  total: number;
}

// STYLES UPDATED FOR 58mm PRINTER
const styles = StyleSheet.create({
  page: {
    padding: 10, // Reduced padding to maximize space
    width: 164, // Corresponds to 58mm width
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 50, // Increased from 12
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 50, // Increased from 9
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 30, // Increased from 8
    marginBottom: 4,
  },
  table: {
    width: '100%',
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 3,
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize:30, // Increased from 8
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 3,
    fontSize: 30, // Increased from 8
  },
  colQty: {
    width: '15%', // Adjusted width
  },
  colDesc: {
    width: '60%', // Adjusted width
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
    fontSize: 50, // Increased from 10
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    fontSize: 30, // Increased from 8
    textAlign: 'center',
    marginTop: 20,
    color: 'black',
  }
});

interface ReceiptPDFProps {
  bill: MesaBill;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ bill }) => {
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
            <Page style={styles.page}>
                <Text style={styles.title}>Terraza Madero</Text>
                <Text style={styles.subtitle}>CUENTA</Text>
                
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
                
                <Text style={styles.footer}>PROPINA NO INCLUIDA.</Text>
            </Page>
        </Document>
    );
};

export default ReceiptPDF;