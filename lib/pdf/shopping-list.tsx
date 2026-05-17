import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  cell: { flex: 1, paddingRight: 6 },
  cellNum: { width: 60, textAlign: "right", paddingRight: 6 },
  cellWide: { flex: 2, paddingRight: 6 },
  header: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    fontWeight: "bold",
  },
  total: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    fontWeight: "bold",
    fontSize: 12,
  },
});

export interface ShoppingListItem {
  name: string;
  needed: number;
  inStock: number;
  toBuy: number;
  baseUnit: string;
  estimatedCost: number | null;
}

interface Props {
  planName: string;
  targetDate?: string | null;
  items: ShoppingListItem[];
  estimatedTotal: number | null;
}

export function ShoppingListPDF({
  planName,
  targetDate,
  items,
  estimatedTotal,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{planName}</Text>
        <Text style={styles.subtitle}>
          Shopping list{targetDate ? ` — target ${targetDate}` : ""}
        </Text>

        <View style={styles.header}>
          <Text style={styles.cellWide}>Ingredient</Text>
          <Text style={styles.cellNum}>Needed</Text>
          <Text style={styles.cellNum}>In stock</Text>
          <Text style={styles.cellNum}>To buy</Text>
          <Text style={styles.cellNum}>Cost (THB)</Text>
        </View>

        {items.map((it, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.cellWide}>{it.name}</Text>
            <Text style={styles.cellNum}>
              {it.needed.toFixed(2)} {it.baseUnit}
            </Text>
            <Text style={styles.cellNum}>
              {it.inStock.toFixed(2)} {it.baseUnit}
            </Text>
            <Text style={styles.cellNum}>
              {it.toBuy.toFixed(2)} {it.baseUnit}
            </Text>
            <Text style={styles.cellNum}>
              {it.estimatedCost !== null ? `฿${it.estimatedCost.toFixed(2)}` : "-"}
            </Text>
          </View>
        ))}

        {estimatedTotal !== null && (
          <View style={styles.total}>
            <Text>Estimated total: ฿{estimatedTotal.toFixed(2)}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
