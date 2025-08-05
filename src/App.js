// import React, { useState, useCallback } from 'react';
// import { Upload, FileText, Download, Trash2, AlertCircle, CheckCircle, Eye } from 'lucide-react';
// import * as XLSX from 'xlsx';

// const PDFOrderAnalyzer = () => {
//   const [uploadedFiles, setUploadedFiles] = useState([]);
//   const [processedData, setProcessedData] = useState([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [allProductsData, setAllProductsData] = useState([]);
//   const [processingStatus, setProcessingStatus] = useState('');
//   const [showRawData, setShowRawData] = useState(false);

//   // Enhanced PDF text extraction with better deduplication
//   const extractTextFromPDF = async (file) => {
//     try {
//       // Load PDF.js if not available
//       if (!window.pdfjsLib) {
//         await loadPDFJS();
//       }

//       // Set worker source
//       if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
//         window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
//       }

//       const arrayBuffer = await file.arrayBuffer();
//       const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
//       const allProducts = [];
//       const processedOrders = new Set(); // Track processed orders to avoid duplicates
      
//       // Process each page separately
//       for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//         setProcessingStatus(`Processing ${file.name} - Page ${pageNum}/${pdf.numPages}...`);
        
//         const page = await pdf.getPage(pageNum);
//         const textContent = await page.getTextContent();
        
//         // Get text with better positioning info
//         const textItems = textContent.items.map(item => ({
//           text: item.str,
//           x: item.transform[4],
//           y: item.transform[5],
//           width: item.width,
//           height: item.height
//         }));
        
//         // Sort by position (top to bottom, left to right)
//         textItems.sort((a, b) => {
//           if (Math.abs(a.y - b.y) > 5) return b.y - a.y; // Top to bottom
//           return a.x - b.x; // Left to right
//         });
        
//         const pageText = textItems.map(item => item.text).join(' ');
        
//         // Extract products from this specific page with deduplication
//         const pageProducts = parseProductsFromPage(pageText, file.name, pageNum, processedOrders);
//         allProducts.push(...pageProducts);
//       }
      
//       return allProducts;

//     } catch (error) {
//       console.error('Error extracting PDF text:', error);
//       setProcessingStatus(`Error processing ${file.name}: ${error.message}`);
//       return [];
//     }
//   };

//   // Load PDF.js dynamically
//   const loadPDFJS = async () => {
//     return new Promise((resolve, reject) => {
//       if (window.pdfjsLib) {
//         resolve();
//         return;
//       }
      
//       const script = document.createElement('script');
//       script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
//       script.onload = () => resolve();
//       script.onerror = () => reject(new Error('Failed to load PDF.js'));
//       document.head.appendChild(script);
//     });
//   };

//   // Improved product parsing with better deduplication
//   const parseProductsFromPage = (pageText, fileName, pageNum, processedOrders) => {
//     const products = [];
//     const cleanText = pageText.replace(/\s+/g, ' ').trim();
    
//     // Look for "Product Details" sections - this is the key identifier in your PDF
//     const productDetailsSections = cleanText.split(/Product Details|TAX INVOICE/i);
    
//     // Process each section that contains product details
//     for (let i = 1; i < productDetailsSections.length; i++) {
//       const section = productDetailsSections[i];
//       if (section.length < 10) continue; // Skip very short sections
      
//       // Extract order number first to avoid duplicates
//       const orderMatch = section.match(/(\d{18}_\d+)/);
//       if (!orderMatch) continue;
      
//       const orderNumber = orderMatch[1];
      
//       // Skip if we've already processed this order
//       if (processedOrders.has(orderNumber)) {
//         continue;
//       }
//       processedOrders.add(orderNumber);
      
//       // Extract product details using more specific patterns
//       const product = extractProductFromSection(section, fileName, pageNum, orderNumber);
//       if (product) {
//         products.push(product);
//       }
//     }
    
//     // If no products found using the Product Details method, try fallback
//     if (products.length === 0) {
//       const fallbackProduct = extractFallbackProduct(cleanText, fileName, pageNum);
//       if (fallbackProduct) {
//         products.push(fallbackProduct);
//       }
//     }

//     return products;
//   };

//   // Extract product from a specific section
//   const extractProductFromSection = (section, fileName, pageNum, orderNumber) => {
//     const product = {
//       fileName: fileName,
//       pageNumber: pageNum,
//       orderNumber: orderNumber,
//       sku: '',
//       productName: '',
//       size: '',
//       quantity: 1,
//       color: '',
//       rawText: section.substring(0, 200) + (section.length > 200 ? '...' : '')
//     };

//     // Extract SKU - look for the pattern before size in the product details line
//     const skuMatch = section.match(/SKU\s+Size\s+Qty\s+Color\s+Order No\.\s*([A-Z_]+)/i) ||
//                      section.match(/([A-Z_]+)\s+[A-Z]{1,3}\s+\d+\s+[A-Za-z]+\s+\d{18}/);
    
//     if (skuMatch) {
//       product.sku = skuMatch[1].trim();
//     }

//     // Extract size - look for common size patterns
//     const sizeMatch = section.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\b/i);
//     if (sizeMatch) {
//       product.size = sizeMatch[1].toUpperCase();
//     }

//     // Extract quantity - look for digit after size
//     const qtyMatch = section.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\s+(\d+)/i);
//     if (qtyMatch) {
//       const qty = parseInt(qtyMatch[2]);
//       if (qty > 0 && qty < 100) {
//         product.quantity = qty;
//       }
//     }

//     // Extract color - look for color after quantity
//     const colorMatch = section.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\s+\d+\s+([A-Za-z]+)/i);
//     if (colorMatch) {
//       product.color = colorMatch[2];
//     }

//     // Set product name based on SKU
//     if (product.sku) {
//       // Parse SKU to get readable product name
//       const skuParts = product.sku.split('_');
//       if (skuParts.length >= 2) {
//         product.productName = skuParts.slice(0, -1).join(' '); // Everything except the last part
//       } else {
//         product.productName = product.sku;
//       }
//     }

//     // Set defaults for missing data
//     product.sku = product.sku || `ITEM_${fileName.replace('.pdf', '')}_${orderNumber}`;
//     product.size = product.size || 'One Size';
//     product.color = product.color || 'Not Specified';
//     product.productName = product.productName || product.sku;

//     // Only return valid products
//     if (product.sku && product.orderNumber) {
//       return product;
//     }
    
//     return null;
//   };

//   // Fallback product extraction
//   const extractFallbackProduct = (text, fileName, pageNum) => {
//     // Look for any order number as a fallback
//     const orderMatch = text.match(/(\d{18}_\d+)/);
//     if (!orderMatch) return null;

//     return {
//       fileName: fileName,
//       pageNumber: pageNum,
//       orderNumber: orderMatch[1],
//       sku: `UNKNOWN_${fileName.replace('.pdf', '')}_P${pageNum}`,
//       productName: `Product from ${fileName}`,
//       size: 'Unknown',
//       quantity: 1,
//       color: 'Unknown',
//       rawText: text.substring(0, 200) + '...'
//     };
//   };

//   // Handle file upload
//   const handleFileUpload = useCallback((event) => {
//     const files = Array.from(event.target.files);
//     const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
//     if (pdfFiles.length !== files.length) {
//       alert('Please upload only PDF files');
//       return;
//     }

//     setUploadedFiles(prev => [...prev, ...pdfFiles]);
//     event.target.value = '';
//   }, []);

//   // Process all uploaded PDFs
//   const processAllPDFs = async () => {
//     if (uploadedFiles.length === 0) {
//       alert('Please upload some PDF files first');
//       return;
//     }

//     setIsProcessing(true);
//     setProcessingStatus('Starting PDF processing...');
//     const allExtractedProducts = [];

//     for (let i = 0; i < uploadedFiles.length; i++) {
//       const file = uploadedFiles[i];
//       setProcessingStatus(`Processing ${file.name} (${i + 1}/${uploadedFiles.length})...`);
      
//       try {
//         const products = await extractTextFromPDF(file);
//         if (products && products.length > 0) {
//           allExtractedProducts.push(...products);
//           setProcessingStatus(`✓ Processed ${file.name} - Found ${products.length} products`);
//         } else {
//           setProcessingStatus(`⚠ Processed ${file.name} - No products found`);
//         }
//       } catch (error) {
//         console.error(`Error processing ${file.name}:`, error);
//         setProcessingStatus(`✗ Error processing ${file.name}: ${error.message}`);
//       }
      
//       await new Promise(resolve => setTimeout(resolve, 500));
//     }

//     setProcessedData(uploadedFiles);
//     setAllProductsData(allExtractedProducts);
//     setIsProcessing(false);
//     setProcessingStatus(`✓ Completed! Found ${allExtractedProducts.length} products from ${uploadedFiles.length} files.`);
//   };

//   // Export all products to Excel
//   const exportToExcel = () => {
//     if (allProductsData.length === 0) {
//       alert('No data to export. Please process some PDFs first.');
//       return;
//     }

//     // Create workbook
//     const wb = XLSX.utils.book_new();

//     // Prepare detailed products data
//     const detailedData = allProductsData.map((item, index) => ({
//       'Row #': index + 1,
//       'Order Number': item.orderNumber,
//       'File Name': item.fileName,
//       'Page': item.pageNumber,
//       'SKU/Product Code': item.sku,
//       'Product Name': item.productName,
//       'Size': item.size,
//       'Color': item.color,
//       'Quantity': item.quantity,
//       'Raw Text Preview': item.rawText
//     }));

//     // Create detailed products sheet
//     const detailedWs = XLSX.utils.json_to_sheet(detailedData);
//     const detailedColWidths = [
//       { wch: 8 },   // Row #
//       { wch: 20 },  // Order Number
//       { wch: 20 },  // File Name
//       { wch: 8 },   // Page
//       { wch: 25 },  // SKU
//       { wch: 25 },  // Product Name
//       { wch: 12 },  // Size
//       { wch: 15 },  // Color
//       { wch: 10 },  // Quantity
//       { wch: 40 }   // Raw Text
//     ];
//     detailedWs['!cols'] = detailedColWidths;
//     XLSX.utils.book_append_sheet(wb, detailedWs, 'All Orders Detail');

//     // Create consolidated view by product and size
//     const consolidatedMap = new Map();
//     allProductsData.forEach(item => {
//       const key = `${item.sku}_${item.size}_${item.color}`;
//       if (consolidatedMap.has(key)) {
//         const existing = consolidatedMap.get(key);
//         existing.totalQuantity += item.quantity;
//         existing.orderCount += 1;
//         existing.orderNumbers.add(item.orderNumber);
//       } else {
//         consolidatedMap.set(key, {
//           sku: item.sku,
//           productName: item.productName,
//           size: item.size,
//           color: item.color,
//           totalQuantity: item.quantity,
//           orderCount: 1,
//           orderNumbers: new Set([item.orderNumber])
//         });
//       }
//     });

//     const consolidatedData = Array.from(consolidatedMap.values()).map(item => ({
//       'SKU/Product Code': item.sku,
//       'Product Name': item.productName,
//       'Size': item.size,
//       'Color': item.color,
//       'Total Quantity': item.totalQuantity,
//       'Number of Orders': item.orderCount,
//       'Unique Orders': item.orderNumbers.size
//     }));

//     // Create consolidated sheet
//     const consolidatedWs = XLSX.utils.json_to_sheet(consolidatedData);
//     XLSX.utils.book_append_sheet(wb, consolidatedWs, 'Consolidated Summary');

//     // Create summary statistics
//     const summaryStats = [
//       { 'Metric': 'Total PDFs Processed', 'Value': uploadedFiles.length },
//       { 'Metric': 'Total Orders Found', 'Value': allProductsData.length },
//       { 'Metric': 'Unique Order Numbers', 'Value': new Set(allProductsData.map(p => p.orderNumber)).size },
//       { 'Metric': 'Unique SKUs', 'Value': new Set(allProductsData.map(p => p.sku)).size },
//       { 'Metric': 'Unique Sizes', 'Value': new Set(allProductsData.map(p => p.size)).size },
//       { 'Metric': 'Total Quantity', 'Value': allProductsData.reduce((sum, p) => sum + p.quantity, 0) }
//     ];

//     const summaryWs = XLSX.utils.json_to_sheet(summaryStats);
//     XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary Statistics');

//     // Save file
//     const fileName = `order-analysis-fixed-${new Date().toISOString().split('T')[0]}.xlsx`;
//     XLSX.writeFile(wb, fileName);
//   };

//   // Remove file
//   const removeFile = (index) => {
//     setUploadedFiles(prev => prev.filter((_, i) => i !== index));
//   };

//   // Clear all data
//   const clearAll = () => {
//     setUploadedFiles([]);
//     setProcessedData([]);
//     setAllProductsData([]);
//     setProcessingStatus('');
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-white rounded-lg shadow-lg p-6">
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">Fixed PDF Order Analyzer</h1>
//           <p className="text-gray-600 mb-8">Upload shipping label PDFs to extract products with proper deduplication</p>

//           {/* Upload Section */}
//           <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
//             <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload PDF Files</h3>
//             <p className="text-gray-500 mb-4">Select PDF shipping labels to extract order data</p>
//             <input
//               type="file"
//               multiple
//               accept=".pdf"
//               onChange={handleFileUpload}
//               className="hidden"
//               id="file-upload"
//             />
//             <label
//               htmlFor="file-upload"
//               className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2 transition-colors"
//             >
//               <Upload className="w-4 h-4" />
//               Choose PDF Files
//             </label>
//           </div>

//           {/* Uploaded Files List */}
//           {uploadedFiles.length > 0 && (
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold text-gray-700 mb-3">Uploaded Files ({uploadedFiles.length})</h3>
//               <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
//                 {uploadedFiles.map((file, index) => (
//                   <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
//                     <div className="flex items-center gap-2">
//                       <FileText className="w-4 h-4 text-red-500" />
//                       <span className="text-sm text-gray-700">{file.name}</span>
//                       <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
//                     </div>
//                     <button
//                       onClick={() => removeFile(index)}
//                       className="text-red-500 hover:text-red-700 p-1"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex gap-4 mb-6">
//             <button
//               onClick={processAllPDFs}
//               disabled={uploadedFiles.length === 0 || isProcessing}
//               className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
//             >
//               {isProcessing ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle className="w-4 h-4" />
//                   Process All PDFs
//                 </>
//               )}
//             </button>

//             <button
//               onClick={exportToExcel}
//               disabled={allProductsData.length === 0}
//               className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
//             >
//               <Download className="w-4 h-4" />
//               Export to Excel
//             </button>

//             <button
//               onClick={() => setShowRawData(!showRawData)}
//               disabled={allProductsData.length === 0}
//               className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
//             >
//               <Eye className="w-4 h-4" />
//               {showRawData ? 'Hide' : 'Show'} Raw Data
//             </button>

//             <button
//               onClick={clearAll}
//               className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
//             >
//               <Trash2 className="w-4 h-4" />
//               Clear All
//             </button>
//           </div>

//           {/* Processing Status */}
//           {isProcessing && (
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
//               <div className="flex items-center gap-2 mb-2">
//                 <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//                 <span className="text-blue-700 font-semibold">Processing PDFs...</span>
//               </div>
//               <div className="text-sm text-blue-600 bg-white p-2 rounded border">
//                 {processingStatus}
//               </div>
//             </div>
//           )}

//           {/* Processing Complete Status */}
//           {!isProcessing && allProductsData.length > 0 && (
//             <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
//               <div className="flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5 text-green-600" />
//                 <span className="text-green-700 font-semibold">Processing Complete!</span>
//               </div>
//               <div className="text-sm text-green-600 mt-1">
//                 Successfully extracted {allProductsData.length} orders from {processedData.length} PDF files
//               </div>
//             </div>
//           )}

//           {/* Results Summary */}
//           {allProductsData.length > 0 && (
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold text-gray-700 mb-4">Extraction Results</h3>
              
//               {/* Summary Cards */}
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <h4 className="font-semibold text-blue-800 text-sm">Total Orders</h4>
//                   <p className="text-2xl font-bold text-blue-600">{allProductsData.length}</p>
//                 </div>
//                 <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                   <h4 className="font-semibold text-green-800 text-sm">Unique Orders</h4>
//                   <p className="text-2xl font-bold text-green-600">
//                     {new Set(allProductsData.map(p => p.orderNumber)).size}
//                   </p>
//                 </div>
//                 <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
//                   <h4 className="font-semibold text-purple-800 text-sm">Unique SKUs</h4>
//                   <p className="text-2xl font-bold text-purple-600">
//                     {new Set(allProductsData.map(p => p.sku)).size}
//                   </p>
//                 </div>
//                 <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
//                   <h4 className="font-semibold text-orange-800 text-sm">Unique Sizes</h4>
//                   <p className="text-2xl font-bold text-orange-600">
//                     {new Set(allProductsData.map(p => p.size)).size}
//                   </p>
//                 </div>
//                 <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
//                   <h4 className="font-semibold text-pink-800 text-sm">Total Quantity</h4>
//                   <p className="text-2xl font-bold text-pink-600">
//                     {allProductsData.reduce((sum, p) => sum + p.quantity, 0)}
//                   </p>
//                 </div>
//                 <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
//                   <h4 className="font-semibold text-indigo-800 text-sm">PDFs Processed</h4>
//                   <p className="text-2xl font-bold text-indigo-600">{processedData.length}</p>
//                 </div>
//               </div>

//               {/* Show Raw Data Toggle */}
//               {showRawData && (
//                 <div className="bg-gray-50 rounded-lg p-4 mb-6">
//                   <h4 className="font-semibold text-gray-700 mb-3">All Extracted Orders</h4>
//                   <div className="max-h-96 overflow-y-auto">
//                     <div className="grid gap-2">
//                       {allProductsData.map((item, index) => (
//                         <div key={index} className="bg-white p-3 rounded border text-xs">
//                           <div className="font-semibold text-gray-800 mb-1">
//                             #{index + 1} - Order: {item.orderNumber}
//                           </div>
//                           <div className="text-gray-600 grid grid-cols-2 gap-2">
//                             <div><span className="font-medium">SKU:</span> {item.sku}</div>
//                             <div><span className="font-medium">Product:</span> {item.productName}</div>
//                             <div><span className="font-medium">Size:</span> {item.size}</div>
//                             <div><span className="font-medium">Color:</span> {item.color}</div>
//                             <div><span className="font-medium">Qty:</span> {item.quantity}</div>
//                             <div><span className="font-medium">File:</span> {item.fileName}</div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Orders Table */}
//               <div className="overflow-x-auto">
//                 <h4 className="font-semibold text-gray-700 mb-3">All Orders</h4>
//                 <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Number</th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-700">SKU</th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-700">Size</th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-700">Color</th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-700">Qty</th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {allProductsData.map((item, index) => (
//                       <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
//                         <td className="px-4 py-3 text-gray-800 font-mono text-xs">{item.orderNumber}</td>
//                         <td className="px-4 py-3 text-gray-800 font-mono text-sm">{item.sku}</td>
//                         <td className="px-4 py-3 text-gray-800">{item.productName}</td>
//                         <td className="px-4 py-3 text-gray-600">{item.size}</td>
//                         <td className="px-4 py-3 text-gray-600">{item.color}</td>
//                         <td className="px-4 py-3 font-semibold text-blue-600">{item.quantity}</td>
//                         <td className="px-4 py-3 text-gray-500 text-xs">{item.fileName}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Fixed Instructions */}
//           <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
//             <div className="flex items-start gap-2">
//               <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
//               <div>
//                 <h4 className="font-semibold text-green-800 mb-2">Fixed Issues:</h4>
//                 <ul className="text-sm text-green-700 space-y-1">
//                   <li>• <strong>Duplicate Prevention:</strong> Uses order numbers to prevent duplicate entries</li>
//                   <li>• <strong>Better Section Detection:</strong> Looks for "Product Details" sections specifically</li>
//                   <li>• <strong>Improved Pattern Matching:</strong> More accurate SKU, size, and color extraction</li>
//                   <li>• <strong>Order-based Processing:</strong> Each order is processed only once</li>
//                   <li>• <strong>Cleaner Data:</strong> Better validation and fallback handling</li>
//                   <li>• <strong>Excel Export:</strong> Includes order numbers for better tracking</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PDFOrderAnalyzer;


            
            import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, Trash2, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

const PDFOrderAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allProductsData, setAllProductsData] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showRawData, setShowRawData] = useState(false);
  const [showQuantitySummary, setShowQuantitySummary] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);

  // Enhanced PDF text extraction with better deduplication
  const extractTextFromPDF = async (file) => {
    try {
      // Load PDF.js if not available
      if (!window.pdfjsLib) {
        await loadPDFJS();
      }

      // Set worker source
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const allProducts = [];
      const processedOrders = new Set(); // Track processed orders to avoid duplicates
      
      // Process each page separately
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingStatus(`Processing ${file.name} - Page ${pageNum}/${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Get text with better positioning info
        const textItems = textContent.items.map(item => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height
        }));
        
        // Sort by position (top to bottom, left to right)
        textItems.sort((a, b) => {
          if (Math.abs(a.y - b.y) > 5) return b.y - a.y; // Top to bottom
          return a.x - b.x; // Left to right
        });
        
        const pageText = textItems.map(item => item.text).join(' ');
        
        // Extract products from this specific page with deduplication
        const pageProducts = parseProductsFromPage(pageText, file.name, pageNum, processedOrders);
        allProducts.push(...pageProducts);
      }
      
      return allProducts;

    } catch (error) {
      console.error('Error extracting PDF text:', error);
      setProcessingStatus(`Error processing ${file.name}: ${error.message}`);
      return [];
    }
  };

  // Load PDF.js dynamically
  const loadPDFJS = async () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  };

  // Improved product parsing with better deduplication
  const parseProductsFromPage = (pageText, fileName, pageNum, processedOrders) => {
    const products = [];
    const cleanText = pageText.replace(/\s+/g, ' ').trim();
    
    // Look for "Product Details" sections - this is the key identifier in your PDF
    const productDetailsSections = cleanText.split(/Product Details|TAX INVOICE/i);
    
    // Process each section that contains product details
    for (let i = 1; i < productDetailsSections.length; i++) {
      const section = productDetailsSections[i];
      if (section.length < 10) continue; // Skip very short sections
      
      // Extract order number first to avoid duplicates
      const orderMatch = section.match(/(\d{18}_\d+)/);
      if (!orderMatch) continue;
      
      const orderNumber = orderMatch[1];
      
      // Skip if we've already processed this order
      if (processedOrders.has(orderNumber)) {
        continue;
      }
      processedOrders.add(orderNumber);
      
      // Extract product details using more specific patterns
      const product = extractProductFromSection(section, fileName, pageNum, orderNumber);
      if (product) {
        products.push(product);
      }
    }
    
    // If no products found using the Product Details method, try fallback
    if (products.length === 0) {
      const fallbackProduct = extractFallbackProduct(cleanText, fileName, pageNum);
      if (fallbackProduct) {
        products.push(fallbackProduct);
      }
    }

    return products;
  };

  // Extract product from a specific section
  const extractProductFromSection = (section, fileName, pageNum, orderNumber) => {
    const product = {
      fileName: fileName,
      pageNumber: pageNum,
      orderNumber: orderNumber,
      sku: '',
      productName: '',
      size: '',
      quantity: 1,
      color: '',
      rawText: section.substring(0, 200) + (section.length > 200 ? '...' : '')
    };

    // Extract SKU - look for the pattern before size in the product details line
    const skuMatch = section.match(/SKU\s+Size\s+Qty\s+Color\s+Order No\.\s*([A-Z_]+)/i) ||
                     section.match(/([A-Z_]+)\s+[A-Z]{1,3}\s+\d+\s+[A-Za-z]+\s+\d{18}/);
    
    if (skuMatch) {
      product.sku = skuMatch[1].trim();
    }

    // Extract size - look for common size patterns
    const sizeMatch = section.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\b/i);
    if (sizeMatch) {
      product.size = sizeMatch[1].toUpperCase();
    }

    // Extract quantity - look for digit after size
    const qtyMatch = section.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\s+(\d+)/i);
    if (qtyMatch) {
      const qty = parseInt(qtyMatch[2]);
      if (qty > 0 && qty < 100) {
        product.quantity = qty;
      }
    }

    // Extract color - look for color after quantity
    const colorMatch = section.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\s+\d+\s+([A-Za-z]+)/i);
    if (colorMatch) {
      product.color = colorMatch[2];
    }

    // Set product name based on SKU
    if (product.sku) {
      // Parse SKU to get readable product name
      const skuParts = product.sku.split('_');
      if (skuParts.length >= 2) {
        product.productName = skuParts.slice(0, -1).join(' '); // Everything except the last part
      } else {
        product.productName = product.sku;
      }
    }

    // Set defaults for missing data
    product.sku = product.sku || `ITEM_${fileName.replace('.pdf', '')}_${orderNumber}`;
    product.size = product.size || 'One Size';
    product.color = product.color || 'Not Specified';
    product.productName = product.productName || product.sku;

    // Only return valid products
    if (product.sku && product.orderNumber) {
      return product;
    }
    
    return null;
  };

  // Fallback product extraction
  const extractFallbackProduct = (text, fileName, pageNum) => {
    // Look for any order number as a fallback
    const orderMatch = text.match(/(\d{18}_\d+)/);
    if (!orderMatch) return null;

    return {
      fileName: fileName,
      pageNumber: pageNum,
      orderNumber: orderMatch[1],
      sku: `UNKNOWN_${fileName.replace('.pdf', '')}_P${pageNum}`,
      productName: `Product from ${fileName}`,
      size: 'Unknown',
      quantity: 1,
      color: 'Unknown',
      rawText: text.substring(0, 200) + '...'
    };
  };

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      alert('Please upload only PDF files');
      return;
    }

    setUploadedFiles(prev => [...prev, ...pdfFiles]);
    event.target.value = '';
  }, []);

  // Process all uploaded PDFs
  const processAllPDFs = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload some PDF files first');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Starting PDF processing...');
    const allExtractedProducts = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      setProcessingStatus(`Processing ${file.name} (${i + 1}/${uploadedFiles.length})...`);
      
      try {
        const products = await extractTextFromPDF(file);
        if (products && products.length > 0) {
          allExtractedProducts.push(...products);
          setProcessingStatus(`✓ Processed ${file.name} - Found ${products.length} products`);
        } else {
          setProcessingStatus(`⚠ Processed ${file.name} - No products found`);
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        setProcessingStatus(`✗ Error processing ${file.name}: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setProcessedData(uploadedFiles);
    setAllProductsData(allExtractedProducts);
    setIsProcessing(false);
    setProcessingStatus(`✓ Completed! Found ${allExtractedProducts.length} products from ${uploadedFiles.length} files.`);
  };

  // Export all products to Excel
  const exportToExcel = () => {
    if (allProductsData.length === 0) {
      alert('No data to export. Please process some PDFs first.');
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare detailed products data
    const detailedData = allProductsData.map((item, index) => ({
      'Row #': index + 1,
      'Order Number': item.orderNumber,
      'Page': item.pageNumber,
      'SKU/Product Code': item.sku,
      'Product Name': item.productName,
      'Size': item.size,
      'Color': item.color,
      'Quantity': item.quantity,
    }));

    // Create detailed products sheet
    const detailedWs = XLSX.utils.json_to_sheet(detailedData);
    const detailedColWidths = [
      { wch: 8 },   // Row #
      { wch: 20 },  // Order Number
      { wch: 8 },   // Page
      { wch: 25 },  // SKU
      { wch: 25 },  // Product Name
      { wch: 12 },  // Size
      { wch: 15 },  // Color
      { wch: 10 },  // Quantity
    ];
    detailedWs['!cols'] = detailedColWidths;
    XLSX.utils.book_append_sheet(wb, detailedWs, 'All Orders Detail');

    // Create consolidated view by product and size
    const consolidatedMap = new Map();
    allProductsData.forEach(item => {
      const key = `${item.sku}_${item.size}_${item.color}`;
      if (consolidatedMap.has(key)) {
        const existing = consolidatedMap.get(key);
        existing.totalQuantity += item.quantity;
        existing.orderCount += 1;
        existing.orderNumbers.add(item.orderNumber);
      } else {
        consolidatedMap.set(key, {
          sku: item.sku,
          productName: item.productName,
          size: item.size,
          color: item.color,
          totalQuantity: item.quantity,
          orderCount: 1,
          orderNumbers: new Set([item.orderNumber])
        });
      }
    });

    const consolidatedData = Array.from(consolidatedMap.values()).map(item => ({
      'SKU/Product Code': item.sku,
      'Product Name': item.productName,
      'Size': item.size,
      'Color': item.color,
      'Total Quantity': item.totalQuantity,
      'Number of Orders': item.orderCount,
      'Unique Orders': item.orderNumbers.size
    }));

    // Create consolidated sheet
    const consolidatedWs = XLSX.utils.json_to_sheet(consolidatedData);
    XLSX.utils.book_append_sheet(wb, consolidatedWs, 'Consolidated Summary');

    // Create summary statistics
    const summaryStats = [
      { 'Metric': 'Total PDFs Processed', 'Value': uploadedFiles.length },
      { 'Metric': 'Total Orders Found', 'Value': allProductsData.length },
      { 'Metric': 'Unique Order Numbers', 'Value': new Set(allProductsData.map(p => p.orderNumber)).size },
      { 'Metric': 'Unique SKUs', 'Value': new Set(allProductsData.map(p => p.sku)).size },
      { 'Metric': 'Unique Sizes', 'Value': new Set(allProductsData.map(p => p.size)).size },
      { 'Metric': 'Total Quantity', 'Value': allProductsData.reduce((sum, p) => sum + p.quantity, 0) }
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryStats);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary Statistics');

    // Save file
    const fileName = `order-analysis-fixed-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Remove file
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all data
  const clearAll = () => {
    setUploadedFiles([]);
    setProcessedData([]);
    setAllProductsData([]);
    setProcessingStatus('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Fixed PDF Order Analyzer</h1>
          <p className="text-gray-600 mb-8">Upload shipping label PDFs to extract products with proper deduplication</p>

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload PDF Files</h3>
            <p className="text-gray-500 mb-4">Select PDF shipping labels to extract order data</p>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose PDF Files
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Uploaded Files ({uploadedFiles.length})</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={processAllPDFs}
              disabled={uploadedFiles.length === 0 || isProcessing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Process All PDFs
                </>
              )}
            </button>

            <button
              onClick={exportToExcel}
              disabled={allProductsData.length === 0}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </button>

            <button
              onClick={() => setShowQuantitySummary(!showQuantitySummary)}
              disabled={allProductsData.length === 0}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showQuantitySummary ? 'Hide' : 'Show'} Quantity Summary
            </button>

            <button
              onClick={() => setShowAllOrders(!showAllOrders)}
              disabled={allProductsData.length === 0}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showAllOrders ? 'Hide' : 'Show'} All Orders
            </button>

            <button
              onClick={clearAll}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-semibold">Processing PDFs...</span>
              </div>
              <div className="text-sm text-blue-600 bg-white p-2 rounded border">
                {processingStatus}
              </div>
            </div>
          )}

          {/* Processing Complete Status */}
          {!isProcessing && allProductsData.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold">Processing Complete!</span>
              </div>
              <div className="text-sm text-green-600 mt-1">
                Successfully extracted {allProductsData.length} orders from {processedData.length} PDF files
              </div>
            </div>
          )}

          {/* Results Summary */}
          {allProductsData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Extraction Results</h3>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 text-sm">Total Orders</h4>
                  <p className="text-2xl font-bold text-blue-600">{allProductsData.length}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 text-sm">Unique Orders</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {new Set(allProductsData.map(p => p.orderNumber)).size}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 text-sm">Unique SKUs</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(allProductsData.map(p => p.sku)).size}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 text-sm">Unique Sizes</h4>
                  <p className="text-2xl font-bold text-orange-600">
                    {new Set(allProductsData.map(p => p.size)).size}
                  </p>
                </div>
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h4 className="font-semibold text-pink-800 text-sm">Total Quantity</h4>
                  <p className="text-2xl font-bold text-pink-600">
                    {allProductsData.reduce((sum, p) => sum + p.quantity, 0)}
                  </p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-800 text-sm">PDFs Processed</h4>
                  <p className="text-2xl font-bold text-indigo-600">{processedData.length}</p>
                </div>
              </div>

              {/* Quantity Summary by Color and Size */}
              {showQuantitySummary && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Quantity Summary by Color & Size</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {(() => {
                      // Group by color and size
                      const quantityMap = new Map();
                      allProductsData.forEach(item => {
                        const key = `${item.color}_${item.size}`;
                        if (quantityMap.has(key)) {
                          const existing = quantityMap.get(key);
                          existing.totalQuantity += item.quantity;
                          existing.orders.push(item);
                        } else {
                          quantityMap.set(key, {
                            color: item.color,
                            size: item.size,
                            totalQuantity: item.quantity,
                            orders: [item]
                          });
                        }
                      });

                      // Sort by color then by size
                      const sortedEntries = Array.from(quantityMap.values()).sort((a, b) => {
                        if (a.color !== b.color) {
                          return a.color.localeCompare(b.color);
                        }
                        // Custom size sorting
                        const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
                        const aIndex = sizeOrder.indexOf(a.size);
                        const bIndex = sizeOrder.indexOf(b.size);
                        if (aIndex !== -1 && bIndex !== -1) {
                          return aIndex - bIndex;
                        }
                        return a.size.localeCompare(b.size);
                      });

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sortedEntries.map((entry, index) => (
                            <div key={index} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{
                                      backgroundColor: entry.color.toLowerCase() === 'black' ? '#000000' :
                                                    entry.color.toLowerCase() === 'white' ? '#ffffff' :
                                                    entry.color.toLowerCase() === 'red' ? '#ef4444' :
                                                    entry.color.toLowerCase() === 'blue' ? '#3b82f6' :
                                                    entry.color.toLowerCase() === 'green' ? '#10b981' :
                                                    entry.color.toLowerCase() === 'purple' ? '#8b5cf6' :
                                                    entry.color.toLowerCase() === 'teal' ? '#14b8a6' :
                                                    '#6b7280',
                                      borderColor: entry.color.toLowerCase() === 'white' ? '#d1d5db' : 'transparent'
                                    }}
                                  ></div>
                                  <span className="font-semibold text-gray-800 capitalize">
                                    {entry.color}
                                  </span>
                                </div>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                                  Size {entry.size}
                                </span>
                              </div>
                              
                              <div className="text-center py-3">
                                <div className="text-3xl font-bold text-green-600 mb-1">
                                  {entry.totalQuantity}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Total Quantity
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  from {entry.orders.length} order{entry.orders.length !== 1 ? 's' : ''}
                                </div>
                              </div>

                              {/* Show individual orders for this color/size */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <details className="cursor-pointer">
                                  <summary className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    View {entry.orders.length} order{entry.orders.length !== 1 ? 's' : ''} →
                                  </summary>
                                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                    {entry.orders.map((order, orderIndex) => (
                                      <div key={orderIndex} className="bg-gray-50 rounded p-2 text-xs">
                                        <div className="font-mono text-gray-600 mb-1">
                                          Order: {order.orderNumber.slice(-8)}...
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-700">
                                            {order.sku} - Qty: {order.quantity}
                                          </span>
                                          <span className="text-gray-500">
                                            {order.fileName.slice(0, 15)}...
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Color-wise Summary */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Color-wise Total Summary</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {(() => {
                    // Group by color only
                    const colorMap = new Map();
                    allProductsData.forEach(item => {
                      if (colorMap.has(item.color)) {
                        const existing = colorMap.get(item.color);
                        existing.totalQuantity += item.quantity;
                        existing.orderCount += 1;
                        existing.sizes.add(item.size);
                      } else {
                        colorMap.set(item.color, {
                          color: item.color,
                          totalQuantity: item.quantity,
                          orderCount: 1,
                          sizes: new Set([item.size])
                        });
                      }
                    });

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from(colorMap.values()).map((colorData, index) => (
                          <div key={index} className="bg-white rounded-lg border p-4 text-center">
                            <div className="flex justify-center items-center gap-2 mb-2">
                              <div 
                                className="w-6 h-6 rounded-full border-2"
                                style={{
                                  backgroundColor: colorData.color.toLowerCase() === 'black' ? '#000000' :
                                                colorData.color.toLowerCase() === 'white' ? '#ffffff' :
                                                colorData.color.toLowerCase() === 'red' ? '#ef4444' :
                                                colorData.color.toLowerCase() === 'blue' ? '#3b82f6' :
                                                colorData.color.toLowerCase() === 'green' ? '#10b981' :
                                                colorData.color.toLowerCase() === 'purple' ? '#8b5cf6' :
                                                colorData.color.toLowerCase() === 'teal' ? '#14b8a6' :
                                                '#6b7280',
                                  borderColor: colorData.color.toLowerCase() === 'white' ? '#d1d5db' : 'transparent'
                                }}
                              ></div>
                              <span className="font-semibold text-gray-800 capitalize">
                                {colorData.color}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                              {colorData.totalQuantity}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              Total Pieces
                            </div>
                            <div className="text-xs text-gray-500">
                              {colorData.orderCount} orders, {colorData.sizes.size} sizes
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Sizes: {Array.from(colorData.sizes).join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* All Orders Table - Now toggleable */}
              {showAllOrders && (
                <div className="overflow-x-auto">
                  <h4 className="font-semibold text-gray-700 mb-3">All Individual Orders</h4>
                  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Number</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">SKU</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Size</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Color</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Qty</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProductsData.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800 font-mono text-xs">{item.orderNumber}</td>
                          <td className="px-4 py-3 text-gray-800 font-mono text-sm">{item.sku}</td>
                          <td className="px-4 py-3 text-gray-800">{item.productName}</td>
                          <td className="px-4 py-3 text-gray-600">{item.size}</td>
                          <td className="px-4 py-3 text-gray-600 capitalize">{item.color}</td>
                          <td className="px-4 py-3 font-semibold text-blue-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{item.fileName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Show Raw Data Toggle */}
              {showRawData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">All Extracted Orders (Raw Data)</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid gap-2">
                      {allProductsData.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded border text-xs">
                          <div className="font-semibold text-gray-800 mb-1">
                            #{index + 1} - Order: {item.orderNumber}
                          </div>
                          <div className="text-gray-600 grid grid-cols-2 gap-2">
                            <div><span className="font-medium">SKU:</span> {item.sku}</div>
                            <div><span className="font-medium">Product:</span> {item.productName}</div>
                            <div><span className="font-medium">Size:</span> {item.size}</div>
                            <div><span className="font-medium">Color:</span> {item.color}</div>
                            <div><span className="font-medium">Qty:</span> {item.quantity}</div>
                            <div><span className="font-medium">File:</span> {item.fileName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fixed Instructions */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-800 mb-2">Fixed Issues:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <strong>Duplicate Prevention:</strong> Uses order numbers to prevent duplicate entries</li>
                  <li>• <strong>Better Section Detection:</strong> Looks for "Product Details" sections specifically</li>
                  <li>• <strong>Improved Pattern Matching:</strong> More accurate SKU, size, and color extraction</li>
                  <li>• <strong>Order-based Processing:</strong> Each order is processed only once</li>
                  <li>• <strong>Cleaner Data:</strong> Better validation and fallback handling</li>
                  <li>• <strong>Excel Export:</strong> Includes order numbers for better tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFOrderAnalyzer;