import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Trash2, ArrowLeft, Check, Minus, ShoppingCart, RefreshCw, Share2, Download, Upload, Edit, X, Copy, ChevronUp, ChevronDown } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  quantity: number;
  isCompleted: boolean;
  isOutOfStock: boolean;
  imageUrl?: string;
  comment?: string;
  completedAt?: Date;
}

interface RestockList {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  products: Product[];
}

export default function GuluInventoryApp() {
  const [lists, setLists] = useState<RestockList[]>(() => {
    const saved = localStorage.getItem('gulu-lists');
    return saved ? JSON.parse(saved).map((l: any) => ({
      ...l,
      createdAt: new Date(l.createdAt),
      products: l.products.map((p: any) => ({...p, completedAt: p.completedAt ? new Date(p.completedAt) : undefined}))
    })) : [
      {
        id: '1',
        name: 'Morning Fresh Produce',
        description: 'Restock fresh fruits and vegetables for morning shift',
        createdAt: new Date('2024-01-15'),
        products: [
          { id: '1', name: 'Bananas', quantity: 20, isCompleted: false, isOutOfStock: false },
          { id: '2', name: 'Apples', quantity: 15, isCompleted: true, isOutOfStock: false, completedAt: new Date() },
          { id: '3', name: 'Carrots', quantity: 10, isCompleted: false, isOutOfStock: false }
        ]
      }
    ];
  });

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductComment, setNewProductComment] = useState('');
  const [editForm, setEditForm] = useState({name: '', imageUrl: '', comment: ''});
  const [productSortBy, setProductSortBy] = useState<'status' | 'name' | 'quantity'>('status');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    localStorage.setItem('gulu-lists', JSON.stringify(lists));
  }, [lists]);

  const selectedList = lists.find(list => list.id === selectedListId) || null;

  const filteredLists = useMemo(() => {
    const filtered = lists.filter(list =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const result = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? result : -result;
      } else if (sortBy === 'quantity') {
        const result = a.products.length - b.products.length;
        return sortOrder === 'asc' ? result : -result;
      } else { // 'date'
        const result = a.createdAt.getTime() - b.createdAt.getTime();
        return sortOrder === 'asc' ? result : -result;
      }
    });
  }, [lists, searchQuery, sortBy, sortOrder]);

  const generateShareCode = (list: RestockList) => {
    const shareData = {
      n: list.name,
      d: list.description,
      p: list.products.map(p => ({
        n: p.name,
        q: p.quantity,
        c: p.comment || '',
        i: p.imageUrl || ''
      }))
    };
    const encoded = btoa(JSON.stringify(shareData));
    return encoded;
  };

  const decodeShareCode = (code: string): RestockList | null => {
    try {
      const decoded = JSON.parse(atob(code));
      return {
        id: Date.now().toString(),
        name: decoded.n || 'Imported List',
        description: decoded.d || '',
        createdAt: new Date(),
        products: (decoded.p || []).map((p: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          name: p.n || 'Unnamed Product',
          quantity: p.q || 0,
          isCompleted: false,
          isOutOfStock: false,
          imageUrl: p.i || '',
          comment: p.c || ''
        }))
      };
    } catch (error) {
      return null;
    }
  };

  const parseCSV = (content: string): RestockList | null => {
    try {
      const lines = content.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV content is empty');
      }
      const listName = lines[0].split(',')[0].trim() || 'Imported List';
      const products: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(part => part.trim());
        const productName = parts[0] || `Product ${products.length + 1}`;
        const imageUrl = parts[1] || '';
        const comment = parts[2] || '';
        products.push({
          id: `${Date.now()}-${products.length}`,
          name: productName,
          quantity: 0,
          isCompleted: false,
          isOutOfStock: false,
          imageUrl: imageUrl || undefined,
          comment: comment || undefined
        });
      }
      return {
        id: Date.now().toString(),
        name: listName,
        description: `Imported from CSV on ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
        products
      };
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Invalid CSV format');
      return null;
    }
  };

  const handleCsvFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setImportError('Please select a CSV file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setCsvFile(file);
    };
    reader.readAsText(file);
  };

  const importCsv = () => {
    if (!csvContent.trim()) {
      setImportError('Please provide CSV content');
      return;
    }
    const importedList = parseCSV(csvContent);
    if (importedList) {
      setLists([...lists, importedList]);
      setShowCsvImportModal(false);
      setCsvContent('');
      setCsvFile(null);
      setImportError('');
      setSelectedListId(importedList.id);
    }
  };

  const createNewList = () => {
    if (newListName.trim()) {
      const newList: RestockList = {
        id: Date.now().toString(),
        name: newListName,
        description: newListDescription,
        createdAt: new Date(),
        products: []
      };
      setLists([...lists, newList]);
      setNewListName('');
      setNewListDescription('');
      setShowNewListForm(false);
    }
  };

  const shareList = (list: RestockList) => {
    const code = generateShareCode(list);
    setShareCode(code);
    setShowShareModal(true);
  };

  const importList = () => {
    if (!importCode.trim()) {
      setImportError('Please enter a share code');
      return;
    }
    const importedList = decodeShareCode(importCode.trim());
    if (importedList) {
      setLists([...lists, importedList]);
      setShowImportModal(false);
      setImportCode('');
      setImportError('');
      setSelectedListId(importedList.id);
    } else {
      setImportError('Invalid share code. Please check the code and try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteList = (listId: string) => setLists(lists.filter(list => list.id !== listId));

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    if (!selectedList) return;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.map(p => p.id === productId ? {...p, ...updates} : p)
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
  };

  const resetAllProducts = () => {
    if (!selectedList) return;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.map(p => ({
        ...p,
        quantity: 0,
        isCompleted: false,
        completedAt: undefined
      }))
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
  };

  const resetProductQuantity = (productId: string) => {
    if (!selectedList) return;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.map(p =>
        p.id === productId ? {...p, quantity: 0} : p
      )
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
  };

  const updateProductQuantity = (productId: string, change: number) => {
    if (!selectedList) return;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.map(p => p.id === productId ? {...p, quantity: Math.max(0, p.quantity + change)} : p)
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
  };

  const toggleProductCompletion = (productId: string) => {
    if (!selectedList) return;

    const product = selectedList.products.find(p => p.id === productId);
    if (!product) return;

    const isNowCompleted = !product.isCompleted;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.map(p =>
        p.id === productId
          ? { ...p, isCompleted: isNowCompleted, completedAt: isNowCompleted ? new Date() : undefined }
          : p
      )
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
  };

  const toggleOutOfStock = (productId: string) => {
    if (!selectedList) return;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.map(p =>
        p.id === productId ? {...p, isOutOfStock: !p.isOutOfStock} : p
      )
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
  };

  const addProduct = () => {
    if (!selectedList || !newProductName.trim()) return;
    const newProduct: Product = {
      id: Date.now().toString(),
      name: newProductName,
      quantity: 0,
      isCompleted: false,
      isOutOfStock: false,
      imageUrl: newProductImage || undefined,
      comment: newProductComment || undefined
    };
    const updatedList = {...selectedList, products: [...selectedList.products, newProduct]};
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
    setNewProductName('');
    setNewProductImage('');
    setNewProductComment('');
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({name: product.name, imageUrl: product.imageUrl || '', comment: product.comment || ''});
    setShowEditModal(true);
  };

  const saveProductEdit = () => {
    if (!editingProduct || !selectedList || !editForm.name.trim()) return;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.map(p =>
        p.id === editingProduct.id ? {
          ...p,
          name: editForm.name,
          imageUrl: editForm.imageUrl || undefined,
          comment: editForm.comment || undefined
        } : p
      )
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const deleteProductFromEdit = () => {
    if (!editingProduct || !selectedList) return;
    const updatedList = {
      ...selectedList,
      products: selectedList.products.filter(p => p.id !== editingProduct.id)
    };
    setLists(lists.map(list => list.id === selectedList.id ? updatedList : list));
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const sortedProducts = useMemo(() => {
    if (!selectedList) return [];
    const productsToSort = selectedList.products
      .filter(p => p.name.toLowerCase().includes(searchProductName.toLowerCase()));

    return productsToSort.sort((a, b) => {
      let comparison = 0;
      if (productSortBy === 'status') {
        const statusA = a.isCompleted ? 1 : 0;
        const statusB = b.isCompleted ? 1 : 0;
        comparison = statusA - statusB;
      } else if (productSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (productSortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      }

      const primarySortResult = productSortOrder === 'asc' ? comparison : -comparison;

      if (primarySortResult === 0) {
        return a.name.localeCompare(b.name);
      }

      return primarySortResult;
    });
  }, [selectedList, searchProductName, productSortBy, productSortOrder]);

  if (selectedList) {
    const inStockProducts = sortedProducts.filter(p => !p.isOutOfStock);
    const outOfStockProducts = sortedProducts.filter(p => p.isOutOfStock);

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedListId(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lists
            </button>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={resetAllProducts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              <div className="text-sm text-gray-600">
                {selectedList.products.filter(p => p.isCompleted && !p.isOutOfStock).length} of {selectedList.products.filter(p => !p.isOutOfStock).length} items completed
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{selectedList.name}</h1>
            <p className="text-slate-600">{selectedList.description}</p>
          </div>
          <div className="mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Add new product..."
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addProduct()}
                className="max-w-md"
              />
              <Input
                placeholder="Image URL (optional)"
                value={newProductImage}
                onChange={(e) => setNewProductImage(e.target.value)}
                className="max-w-md"
              />
              <Input
                placeholder="Comment (optional)"
                value={newProductComment}
                onChange={(e) => setNewProductComment(e.target.value)}
                className="max-w-md"
              />
              <Button onClick={addProduct}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <Input
                 placeholder="Search products..."
                 value={searchProductName}
                 onChange={(e) => setSearchProductName(e.target.value)}
                 className="pl-10"
              />
            </div>
            <div className="flex gap-2">
                <Select value={productSortBy} onValueChange={(value: 'status' | 'name' | 'quantity') => setProductSortBy(value)}>
                    <SelectTrigger className="w-auto border rounded-md bg-white">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="quantity">Quantity</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    onClick={() => setProductSortOrder(productSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border rounded-md bg-white hover:bg-slate-50 transition-colors"
                >
                    {productSortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>
          </div>

          {inStockProducts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">In Stock ({inStockProducts.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inStockProducts.map(product => (
                  <div
                      key={product.id}
                      className="border-2 rounded-xl transition-all hover:shadow-md bg-white border-slate-200"
                  >
                    <div
                       className="p-4 cursor-pointer"
                       onClick={() => openEditModal(product)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOutOfStock(product.id);
                            }}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
                            title="Mark as out of stock"
                          >
                            <ShoppingCart className="w-4 h-4 text-green-500" />
                          </button>
                          <h3 className={`font-semibold ${product.isCompleted ? 'text-green-600 line-through' : 'text-slate-800'}`}>
                            {product.name}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetProductQuantity(product.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 z-10"
                          title="Reset quantity"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      {product.comment && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{product.comment}</p>}
                      {product.imageUrl && (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-center gap-0 mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProductQuantity(product.id, -1);
                          }}
                          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors border border-slate-300 rounded-l-md z-10"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <div className="w-12 h-10 bg-white border-y border-slate-300 flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-800">{product.quantity}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProductQuantity(product.id, 1);
                          }}
                          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors border border-slate-300 rounded-r-md z-10"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProductCompletion(product.id);
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-md transition-colors z-10 ${
                          product.isCompleted
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {product.isCompleted ? <Check className="w-3 h-3 inline mr-1" /> : null} {product.isCompleted ? 'Done' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {outOfStockProducts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Out of Stock ({outOfStockProducts.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {outOfStockProducts.map(product => (
                  <div
                      key={product.id}
                      className="border-2 rounded-xl transition-all hover:shadow-md bg-red-50 border-red-200"
                  >
                    <div
                       className="p-4 cursor-pointer"
                       onClick={() => openEditModal(product)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOutOfStock(product.id);
                            }}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
                            title="Mark as in stock"
                          >
                            <ShoppingCart className="w-4 h-4 text-red-500" />
                          </button>
                          <h3 className={`font-semibold ${product.isCompleted ? 'text-green-600 line-through' : 'text-slate-800'}`}>
                            {product.name}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetProductQuantity(product.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 z-10"
                          title="Reset quantity"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      {product.comment && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{product.comment}</p>}
                      {product.imageUrl && (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-center gap-0 mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProductQuantity(product.id, -1);
                          }}
                          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors border border-slate-300 rounded-l-md z-10"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <div className="w-12 h-10 bg-white border-y border-slate-300 flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-800">{product.quantity}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProductQuantity(product.id, 1);
                          }}
                          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors border border-slate-300 rounded-r-md z-10"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProductCompletion(product.id);
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-md transition-colors z-10 ${
                          product.isCompleted
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {product.isCompleted ? <Check className="w-3 h-3 inline mr-1" /> : null} {product.isCompleted ? 'Done' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {inStockProducts.length === 0 && outOfStockProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No products in this list yet. Add some above!</p>
            </div>
          )}
        </div>
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Make changes to this product here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="productName" className="text-right">
                  Name
                </Label>
                <Input
                  id="productName"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right">
                  Comment
                </Label>
                <Textarea
                  id="comment"
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between items-center">
              <Button onClick={deleteProductFromEdit} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveProductEdit} disabled={!editForm.name.trim()}>
                  Save changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Gulu Inventory</h1>
            <p className="text-slate-600 text-lg">Manage your shelf restocking efficiently</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <Input
                   placeholder="Search lists..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'quantity') => setSortBy(value)}>
                <SelectTrigger className="w-auto border rounded-md bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="quantity">Items</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border rounded-md bg-white hover:bg-slate-50 transition-colors"
              >
                {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              <Dialog open={showCsvImportModal} onOpenChange={setShowCsvImportModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-muted-foreground flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Import from CSV</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file to create a new restock list.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileUpload}
                    />
                    {importError && <p className="text-red-500 text-sm">{importError}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCsvImportModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={importCsv} disabled={!csvFile}>
                      Import List
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-muted-foreground flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Import Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Import from Code</DialogTitle>
                    <DialogDescription>
                      Paste a share code to import a new restock list.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      value={importCode}
                      onChange={(e) => setImportCode(e.target.value)}
                      placeholder="Paste share code here..."
                    />
                    {importError && <p className="text-red-500 text-sm">{importError}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowImportModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={importList} disabled={!importCode}>
                      Import List
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showNewListForm} onOpenChange={setShowNewListForm}>
                <DialogTrigger asChild>
                  <button
                    style={{ backgroundColor: '#58ab7f', color: 'white' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4a9c6f'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#58ab7f'; }}
                    className="px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New List
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New List</DialogTitle>
                    <DialogDescription>
                      Enter the name and an optional description for your new list.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="listName" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="listName"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="e.g., Morning Restock"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="listDescription" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="listDescription"
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        placeholder="e.g., Items for the morning shift"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewListForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createNewList} disabled={!newListName.trim()}>
                      Create List
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLists.map(list => {
              const completedCount = list.products.filter(p => p.isCompleted && !p.isOutOfStock).length;
              const totalCount = list.products.length;

              return (
                <Card key={list.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        <CardDescription>{list.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-sm text-slate-600">Items</span><span className="text-sm font-medium">{totalCount}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-slate-600">Completed</span><span className="text-sm font-medium text-green-600">{completedCount}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-slate-600">Created</span><span className="text-sm text-slate-500">{list.createdAt.toLocaleDateString()}</span></div>
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedListId(list.id)}
                        className="flex-1"
                      >
                        Open List
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareList(list);
                        }}
                        variant="ghost"
                        className="p-2"
                        title="Share List"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteList(list.id);
                        }}
                        variant="destructive"
                        className="p-2"
                        title="Delete List"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredLists.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">{searchQuery ? 'No lists found' : 'No lists created yet'}</p>
              {!showNewListForm && (
                <Button onClick={() => setShowNewListForm(true)} className="mt-4">
                  Create your first list
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share List</DialogTitle>
            <DialogDescription>
              Copy and share this code with others to import your list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input value={shareCode} readOnly />
            <Button onClick={() => copyToClipboard(shareCode)}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}