import { useState } from "react";
import API from "../api";

function QuoteForm({ rfp, onClose, onSuccess }) {
  const [items, setItems] = useState([
    { item_name: "", vendor_price: "", quantity: 1 },
  ]);

  const addRow = () => {
    setItems([...items, { item_name: "", vendor_price: "", quantity: 1 }]);
  };

  const updateRow = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const submitQuote = async () => {
    try {
      await API.post(`vendor/rfp/${rfp.id}/quote/`, { items });
      alert("Quote submitted successfully");
      onSuccess();
      onClose();
    } catch {
      alert("Quote submission failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6">
        <h2 className="text-2xl font-bold mb-4">Submit Quote - {rfp.title}</h2>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-3 gap-3">
              <input
                placeholder="Item name"
                value={item.item_name}
                onChange={(e) => updateRow(index, "item_name", e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
              <input
                placeholder="Vendor price"
                value={item.vendor_price}
                onChange={(e) => updateRow(index, "vendor_price", e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
              <input
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) => updateRow(index, "quantity", e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={addRow}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg"
          >
            Add Item
          </button>
          <button
            onClick={submitQuote}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Submit
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuoteForm;