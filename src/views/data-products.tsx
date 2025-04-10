import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, AlertCircle, Database, ChevronDown, Upload, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { useApi } from '@/hooks/use-api';
import { Textarea } from '@/components/ui/textarea';
import { DataProduct, Info, InputPort, OutputPort, Server, DataProductStatus, DataProductArchetype, DataProductOwner, MetastoreTableInfo } from '@/types/data-product';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { debounce } from 'lodash';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Ajv, { ValidateFunction, ErrorObject } from "ajv"
import addFormats from "ajv-formats" // Recommended for formats like date-time
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { RelativeDate } from '@/components/common/relative-date';

// --- Helper Function Type Definition --- 
type CheckApiResponseFn = <T>(
    response: { data?: T | { detail?: string }, error?: string },
    name: string
) => T;

// --- Helper Function Implementation (outside component) --- 
const checkApiResponse: CheckApiResponseFn = (response, name) => {
    if (response.error) {
        throw new Error(`${name} fetch failed: ${response.error}`);
    }
    // Check if data itself contains a FastAPI error detail
    if (response.data && typeof response.data === 'object' && 'detail' in response.data && typeof response.data.detail === 'string') {
        throw new Error(`${name} fetch failed: ${response.data.detail}`);
    }
    // Ensure data is not null/undefined before returning
    if (response.data === null || response.data === undefined) {
        throw new Error(`${name} fetch returned null or undefined data.`);
    }
    // Type assertion after checks - implicit from signature
    return response.data as any; // Use 'as any' temporarily if needed, but the signature defines T
};

// --- Helper Functions for Object <-> Array Transformation --- 

// Generic object to array of {key, value}
const objectToArray = (obj: Record<string, any> | null | undefined): { key: string, value: any }[] => {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
};

// Array of {key, value} back to object
const arrayToObject = (arr: { key: string, value: any }[] | null | undefined): Record<string, any> => {
  if (!arr || !Array.isArray(arr)) return {};
  return arr.reduce((acc, { key, value }) => {
    if (key) acc[key] = value; // Only include if key is not empty
    return acc;
  }, {} as Record<string, any>);
};

// Specific for DataProduct['links'] (value is {url, description})
const linksObjectToArray = (obj: Record<string, { url: string, description?: string }> | null | undefined): { key: string, url: string, description: string }[] => {
   if (!obj) return [];
   return Object.entries(obj).map(([key, linkValue]) => ({ key, url: linkValue.url || '', description: linkValue.description || '' }));
};

// Array back to DataProduct['links'] object
const linksArrayToObject = (arr: { key: string, url: string, description: string }[] | null | undefined): Record<string, { url: string, description?: string }> => {
    if (!arr || !Array.isArray(arr)) return {};
    return arr.reduce((acc, { key, url, description }) => {
       if (key && url) { // Require key and url
          acc[key] = { url, description: description || '' }; 
       }
       return acc;
   }, {} as Record<string, { url: string, description?: string }>);
};

// Specific for Port['links'] (value is string/url)
const portLinksObjectToArray = (obj: Record<string, string> | null | undefined): { key: string, value: string }[] => {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({ key, value: value || '' }));
};

// Array back to Port['links'] object (same as generic arrayToObject)
const portLinksArrayToObject = (arr: { key: string, value: string }[] | null | undefined): Record<string, string> => {
  return arrayToObject(arr);
};

// Helper to remove known optional fields if they are empty strings
const cleanEmptyOptionalStrings = (data: Record<string, any>): Record<string, any> => {
  const cleanedData = JSON.parse(JSON.stringify(data)); // Deep clone

  const checkAndClean = (obj: any, fields: string[]) => {
    if (typeof obj !== 'object' || obj === null) return;
    fields.forEach(field => {
      if (obj.hasOwnProperty(field) && obj[field] === "") {
        delete obj[field];
      }
    });
  };

  // Clean top-level optional fields (if any - none currently identified)

  // Clean Info fields
  if (cleanedData.info) {
    checkAndClean(cleanedData.info, ['domain', 'description', 'status', 'archetype', 'maturity']);
  }

  // Clean Port fields (common)
  const cleanPort = (port: any) => {
     checkAndClean(port, ['description', 'type', 'location']);
     // Recursively clean Server if it exists
     if (port.server) {
        checkAndClean(port.server, [
            'project', 'dataset', 'account', 'database', 'schema', // Assuming schema alias
            'host', 'topic', 'location', 'delimiter', 'format', 
            'table', 'view', 'share'
        ]);
        // Clean empty server object itself?
        if (Object.keys(port.server).length === 0) {
           delete port.server;
        }
     }
     // Clean specific OutputPort fields
      checkAndClean(port, ['status', 'dataContractId']); 
  };

  (cleanedData.inputPorts || []).forEach(cleanPort);
  (cleanedData.outputPorts || []).forEach(cleanPort);
  
  // Also clean empty objects/arrays for tags/links/custom?
  if (Array.isArray(cleanedData.tags) && cleanedData.tags.length === 0) delete cleanedData.tags;
  if (typeof cleanedData.links === 'object' && Object.keys(cleanedData.links).length === 0) delete cleanedData.links;
  if (typeof cleanedData.custom === 'object' && Object.keys(cleanedData.custom).length === 0) delete cleanedData.custom;

  return cleanedData;
};

// --- Port Metadata Editor Sub-Component --- 
interface PortMetadataEditorProps {
  control: any; // Control object from useForm
  register: any; // Register function from useForm
  getValues: any; // getValues function from useForm
  setValue: any; // setValue function from useForm
  portIndex: number;
  portType: 'inputPorts' | 'outputPorts';
}

const PortMetadataEditor: React.FC<PortMetadataEditorProps> = ({ 
  control, register, getValues, setValue, portIndex, portType 
}) => {
  const linksFieldName = `${portType}.${portIndex}.links` as const;
  const customFieldName = `${portType}.${portIndex}.custom` as const;

  // Internal state for the arrays
  const [portLinksArray, setPortLinksArray] = useState<{ key: string, value: string }[]>([]);
  const [portCustomArray, setPortCustomArray] = useState<{ key: string, value: string }[]>([]);

  // Initialize state from RHF values when component mounts or index changes
  useEffect(() => {
    const initialLinks = getValues(linksFieldName);
    const initialCustom = getValues(customFieldName);
    setPortLinksArray(portLinksObjectToArray(initialLinks));
    setPortCustomArray(objectToArray(initialCustom));
  }, [portIndex, portType, getValues, linksFieldName, customFieldName]);

  // Update RHF state when internal array state changes
  useEffect(() => {
    setValue(linksFieldName, portLinksArrayToObject(portLinksArray), { shouldValidate: false, shouldDirty: true });
  }, [portLinksArray, setValue, linksFieldName]);

  useEffect(() => {
    setValue(customFieldName, arrayToObject(portCustomArray), { shouldValidate: false, shouldDirty: true });
  }, [portCustomArray, setValue, customFieldName]);

  return (
    <div className="space-y-4 mt-4 pt-4 border-t">
        {/* Port Links Editor */}
        <div className="space-y-2">
            <Label className="font-semibold">Port Links</Label>
            {portLinksArray.map((link, index) => (
               <div key={`link-${index}`} className="flex items-center gap-2">
                  <Input 
                      placeholder="Link Key" 
                      value={link.key}
                      onChange={(e) => {
                          const newArr = [...portLinksArray];
                          newArr[index].key = e.target.value;
                          setPortLinksArray(newArr);
                      }}
                      className="flex-1"
                  />
                  <Input 
                      placeholder="URL" 
                      value={link.value}
                       onChange={(e) => {
                          const newArr = [...portLinksArray];
                          newArr[index].value = e.target.value;
                          setPortLinksArray(newArr);
                      }}
                      className="flex-1"
                  />
                  <Button 
                      type="button" variant="ghost" size="icon" 
                      onClick={() => setPortLinksArray(portLinksArray.filter((_, i) => i !== index))}
                      className="text-destructive" title="Remove Link">
                      <X className="h-4 w-4" />
                  </Button>
               </div>
            ))}
            {/* Wrap button in div to ensure block layout */}
            <div>
              <Button 
                 type="button" variant="outline" size="sm"
                 onClick={() => setPortLinksArray([...portLinksArray, { key: '', value: '' }])}>
                 <Plus className="mr-2 h-4 w-4"/> Add Link
              </Button>
            </div>
        </div>

        {/* Port Custom Properties Editor */}
        <div className="space-y-2">
            <Label className="font-semibold">Port Custom Properties</Label>
            {portCustomArray.map((custom, index) => (
               <div key={`custom-${index}`} className="flex items-center gap-2">
                  <Input 
                      placeholder="Property Key" 
                      value={custom.key}
                      onChange={(e) => {
                          const newArr = [...portCustomArray];
                          newArr[index].key = e.target.value;
                          setPortCustomArray(newArr);
                      }}
                      className="flex-1"
                  />
                  <Input 
                      placeholder="Property Value" 
                      value={custom.value}
                       onChange={(e) => {
                          const newArr = [...portCustomArray];
                          newArr[index].value = e.target.value;
                          setPortCustomArray(newArr);
                      }}
                      className="flex-1"
                  />
                  <Button 
                      type="button" variant="ghost" size="icon" 
                      onClick={() => setPortCustomArray(portCustomArray.filter((_, i) => i !== index))}
                      className="text-destructive" title="Remove Property">
                      <X className="h-4 w-4" />
                  </Button>
               </div>
            ))}
             {/* Wrap button in div to ensure block layout */}
            <div>
              <Button 
                 type="button" variant="outline" size="sm"
                 onClick={() => setPortCustomArray([...portCustomArray, { key: '', value: '' }])}>
                 <Plus className="mr-2 h-4 w-4"/> Add Custom Property
              </Button>
            </div>
        </div>
    </div>
  );
};

// --- Component Code ---

export default function DataProducts() {
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Use the imported types for state
  const [statuses, setStatuses] = useState<DataProductStatus[]>([]);
  const [archetypes, setArchetypes] = useState<DataProductArchetype[]>([]);
  const [owners, setOwners] = useState<DataProductOwner[]>([]);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [tableSearchResults, setTableSearchResults] = useState<MetastoreTableInfo[]>([]);
  const [isSearchingTables, setIsSearchingTables] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState<Record<number, boolean>>({});

  // State for managing dynamic arrays for Links and Custom properties (main product)
  const [linksArray, setLinksArray] = useState<{key: string, url: string, description: string}[]>([]);
  const [customArray, setCustomArray] = useState<{key: string, value: string}[]>([]); // Treat custom value as string in UI

  // State for JSON Editor Tab
  const [activeTab, setActiveTab] = useState<'ui' | 'json'>('ui');
  const [jsonString, setJsonString] = useState<string>('');
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);

  // State for Schema Validation
  const [dataProductSchema, setDataProductSchema] = useState<object | null>(null);
  const [schemaValidator, setSchemaValidator] = useState<ValidateFunction | null>(null);
  const [schemaValidationErrors, setSchemaValidationErrors] = useState<ErrorObject[] | null>(null);
  const [validationStatusMessage, setValidationStatusMessage] = useState<string | null>(null);
  const [isSchemaLoading, setIsSchemaLoading] = useState<boolean>(false);

  const { get, post, put, delete: deleteApi } = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize Ajv instance using useRef, but create/configure in useEffect
  const ajv = useRef<Ajv | null>(null);

  // Effect to initialize Ajv and add formats only once on mount
  useEffect(() => {
    if (!ajv.current) { // Only initialize if not already done
      console.log("Initializing Ajv and adding formats...");
      // Configure Ajv to log warnings for unknown keywords instead of throwing errors
      const ajvInstance = new Ajv({ 
          allErrors: true,
          strict: "log" // Use "log" to allow keywords like "example"
      });
      addFormats(ajvInstance);
      ajv.current = ajvInstance;
    }
  }, []); // Empty dependency array ensures this runs only once

  // React Hook Form setup
  const { 
    register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } 
  } = useForm<DataProduct>({
    // Default values will be set when opening the dialog
  });

  // Destructure getValues and setValue as well
  const { getValues, setValue } = useForm<DataProduct>();

  // Field Arrays for Ports
  const { fields: inputPortFields, append: appendInputPort, remove: removeInputPort } = useFieldArray({
    control,
    name: "inputPorts"
  });
  const { fields: outputPortFields, append: appendOutputPort, remove: removeOutputPort } = useFieldArray({
    control,
    name: "outputPorts"
  });

  // Debounced search function
  const debouncedTableSearch = useRef(
    debounce(async (query: string) => {
      if (!query) {
        setTableSearchResults([]); // Clear results if query is empty
        setIsSearchingTables(false);
        return;
      }
      setIsSearchingTables(true);
      try {
        const response = await get<MetastoreTableInfo[]>(`/api/metadata/tables/search?query=${encodeURIComponent(query)}&limit=50`);
        if (response.error) throw new Error(response.error);
        setTableSearchResults(response.data || []);
      } catch (err) {
        console.error("Error searching tables:", err);
        setTableSearchResults([]); // Clear results on error
      } finally {
        setIsSearchingTables(false);
      }
    }, 300) // 300ms debounce
  ).current;

  // Function to fetch initial tables for the combobox
  const fetchInitialTables = async () => {
      setIsSearchingTables(true);
      try {
        const response = await get<MetastoreTableInfo[]>('/api/metadata/tables/initial?limit=20');
        if (response.error) throw new Error(response.error);
        setTableSearchResults(response.data || []);
      } catch (err) {
        console.error("Error fetching initial tables:", err);
        setTableSearchResults([]);
      } finally {
         setIsSearchingTables(false);
      }
  };

  // Handle search input change
  const handleTableSearchInputChange = (query: string) => {
    setTableSearchQuery(query);
    debouncedTableSearch(query);
  };
  
  // Handle opening the combobox - fetch initial tables
  const handleComboboxOpenChange = (open: boolean, index: number) => {
      setIsComboboxOpen(prev => ({ ...prev, [index]: open }));
      if (open) {
          // Reset search state and fetch initial list when opening
          setTableSearchQuery("");
          fetchInitialTables();
      } else {
          // Optionally clear results when closing
          // setTableSearchResults([]); 
      }
  };

  // Fetch initial data including metastore tables
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsResp, statusesResp, archetypesResp, ownersResp] = await Promise.all([
          get<DataProduct[]>('/api/data-products'),
          get<DataProductStatus[]>('/api/data-products/statuses'),
          get<DataProductArchetype[]>('/api/data-products/archetypes'),
          get<DataProductOwner[]>('/api/data-products/owners'),
        ]);

        // Use the helper to check responses and extract data
        const productsData = checkApiResponse(productsResp, 'Products');
        const statusesData = checkApiResponse(statusesResp, 'Statuses');
        const archetypesData = checkApiResponse(archetypesResp, 'Archetypes');
        const ownersData = checkApiResponse(ownersResp, 'Owners');
        
        // Set state with validated data
        setProducts(Array.isArray(productsData) ? productsData : []);
        setStatuses(Array.isArray(statusesData) ? statusesData : []);
        setArchetypes(Array.isArray(archetypesData) ? archetypesData : []);
        setOwners(Array.isArray(ownersData) ? ownersData : []);

      } catch (err: any) {
        // Catch errors thrown by checkApiResponse or Promise.all
        console.error('Error fetching initial data:', err);
        setError(err.message || 'Failed to load initial data');
        setProducts([]);
        setStatuses([]);
        setArchetypes([]);
        setOwners([]);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [get]);

  // Function to refetch products only (e.g., after create/update/delete)
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<DataProduct[]>('/api/data-products');
      if (response.error) throw new Error(response.error);
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
      setProducts([]); // Ensure products is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  // --- Dialog Open/Close Handlers --- 
  const createDefaultProduct = (): DataProduct => {
    const now = new Date().toISOString();
    return {
      dataProductSpecification: "0.0.1",
      id: "",
      info: { title: "", owner: "" },
      inputPorts: [],
      outputPorts: [],
      links: {}, 
      custom: {}, 
      tags: [],
      created_at: now, 
      updated_at: now,
    };
  }

  const handleOpenDialog = async (product?: DataProduct) => {
    setFormError(null);
    setJsonParseError(null); // Clear JSON errors too
    setActiveTab('ui'); // Always start in UI tab
    setValidationStatusMessage(null); // Clear validation status
    setSchemaValidationErrors(null); // Clear detailed errors
    
    try {
        let defaultValues: DataProduct;
        if (product && product.id) {
            // --- EDIT MODE --- 
            console.log(`Fetching product ${product.id} for editing...`);
            
            const response = await get<DataProduct>(`/api/data-products/${product.id}`);
            const productDataForEdit = checkApiResponse(response, `Fetch product ${product.id}`);

            // The fetched data *excludes* created_at/updated_at, which is correct for the form
            defaultValues = productDataForEdit;
            // Set selectedProduct *before* resetting, as reset might trigger effects
            setSelectedProduct(product); // Keep original full row data if needed (e.g., for comparison)
            console.log("Received data for edit form:", defaultValues);

        } else {
            // --- CREATE MODE --- 
            defaultValues = createDefaultProduct();
            setSelectedProduct(null);
        }
        
        // Ensure arrays/objects exist for RHF (common for both modes)
        defaultValues.inputPorts = defaultValues.inputPorts || [];
        defaultValues.outputPorts = defaultValues.outputPorts || [];
        defaultValues.tags = defaultValues.tags || [];
        defaultValues.links = defaultValues.links || {};
        defaultValues.custom = defaultValues.custom || {};
        defaultValues.info = defaultValues.info || { title: "", owner: "" };

        // Reset the form with the fetched or default data
        reset(defaultValues);

        // Populate state arrays for custom editors (Links, Custom) *after* reset
        setLinksArray(linksObjectToArray(defaultValues.links));
        setCustomArray(objectToArray(defaultValues.custom));

        // Initialize JSON string based on the fetched/default data for the JSON editor tab
        const cleanedDataForJson = cleanEmptyOptionalStrings(defaultValues);
        const formattedJson = JSON.stringify(cleanedDataForJson, null, 2);
        setJsonString(formattedJson);
        setIsJsonValid(true); // Assume valid initially
        // Optionally run validation immediately if schema is ready and we are editing
        if (schemaValidator && product) {
            validateProductObject(cleanedDataForJson);
        }

        setIsDialogOpen(true);
        
    } catch (err: any) {
        console.error('Error preparing dialog:', err);
        setError(`Failed to load product data for editing: ${err.message}`);
        // Show error toast
        toast({ 
            title: "Error Loading Data",
            description: `Could not fetch details for product. ${err.message}`,
            variant: "destructive"
        });
        setIsDialogOpen(false); // Don't open dialog if fetch failed
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    reset(); 
  };

  // --- CRUD Handlers --- 
  const handleDeleteProduct = async (id: string) => {
      if (!confirm("Are you sure you want to delete this data product?")) {
          return;
      }
      setError(null); // Clear previous errors
      try {
          // Assume deleteApi throws on HTTP error status
          await deleteApi(`/api/data-products/${id}`);
          console.log(`Successfully deleted product ${id}`);
          await fetchProducts(); // Refetch the list
          // TODO: Add success notification
      } catch (err: any) {
          console.error(`Error deleting product ${id}:`, err);
          setError(err.message || 'Failed to delete product');
          // TODO: Add error notification
      }
  };

  const onFormSubmit = async (data: DataProduct) => {
    setFormError(null); 
    const isUpdating = !!selectedProduct?.id;
    const productId = selectedProduct?.id;
    console.log(`Submitting form. Mode: ${isUpdating ? 'Update' : 'Create'}. ID: ${productId || '(new)'}`);

    // Prepare payload carefully
    const payloadRaw = { ...data }; 
    const now = new Date().toISOString();
    payloadRaw.updated_at = now;

    // Convert state arrays back to objects before submitting
    payloadRaw.links = linksArrayToObject(linksArray);
    payloadRaw.custom = arrayToObject(customArray);

    // Clean the final payload before sending to API
    const payload = cleanEmptyOptionalStrings(payloadRaw);

    try {
        let response;
        if (isUpdating && productId) {
            // --- UPDATE --- 
            payload.id = productId; 
            // Remove created_at if it exists, backend should preserve original
            if ('created_at' in payload) {
                delete payload.created_at;
            }
            console.log("Submitting cleaned update payload:", JSON.stringify(payload, null, 2));
            response = await put<DataProduct>(`/api/data-products/${productId}`, payload);
        } else {
            // --- CREATE --- 
            payload.created_at = now;
            // Ensure ID exists for creation - generate UUID if missing
            if (!payload.id) {
                 console.log("Generating new UUID for product creation.");
                 // Simple frontend UUID generation (consider a library like `uuid` for robustness if needed)
                 payload.id = crypto.randomUUID(); 
            }
            console.log("Submitting cleaned create payload:", JSON.stringify(payload, null, 2)); 
            response = await post<DataProduct>('/api/data-products', payload);
        }

        // Check response
        const result = checkApiResponse(response, isUpdating ? 'Update Product' : 'Create Product');

        console.log('Form submission successful:', result);
        handleCloseDialog();
        await fetchProducts(); // Refetch products list
        // TODO: Add success notification

    } catch (err: any) {
        console.error('Error submitting product form:', err);
        setFormError(err.message || 'An unexpected error occurred.');
        // TODO: Add error notification
    }
  };

  // --- File Upload Handlers (Re-insert) --- 
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await post<DataProduct[]>('/api/data-products/upload', formData);
      // Use the response error if present
      if (response.error) {
        throw new Error(response.error);
      }
      console.log('Successfully uploaded products:', response.data);
      toast({ 
        title: "Upload Successful",
        description: `Successfully processed file ${file.name}. Added ${response.data?.length || 0} product(s).`,
      });
      await fetchProducts();
    } catch (err: any) {
      console.error('Error uploading file:', err);
      // Use the error message directly in the toast
      toast({
          title: "Upload Failed",
          description: err.message || 'An unexpected error occurred during upload.',
          variant: "destructive"
      });
      setError(err.message || 'Failed to upload file'); // Optionally keep setting general error state too
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  // --- Helper Functions --- 
  const getStatusColor = (status: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    const lowerStatus = status?.toLowerCase() || '';
    if (lowerStatus.includes('active')) {
        return 'default'; // Map active to default or secondary
    }
    if (lowerStatus.includes('development')) {
        return 'secondary';
    }
    if (lowerStatus.includes('retired') || lowerStatus.includes('deprecated')) {
        return 'outline'; // Use outline for warning-like
    }
    if (lowerStatus.includes('deleted') || lowerStatus.includes('archived')) {
        return 'destructive';
    }
    return 'default'; // Default for draft, proposed, etc.
  };

  // --- Fetch Schema and Compile --- 
  useEffect(() => {
    const schemaName = "dataproduct_schema_v0_0_1";
    const fetchAndCompileSchema = async () => {
      if (dataProductSchema || !ajv.current) return;
      setIsSchemaLoading(true);
      setValidationStatusMessage("Loading schema...");
      setSchemaValidationErrors(null);
      try {
        const response = await get<object>(`/api/metadata/schemas/${schemaName}`);
        const schema = checkApiResponse(response, 'Schema Fetch');
        setDataProductSchema(schema);
        const validate = ajv.current.compile(schema);
        setSchemaValidator(() => validate);
        setValidationStatusMessage("Schema loaded.");
        console.log("Data Product schema loaded and compiled successfully.");
      } catch (err: any) {
        console.error("Error fetching or compiling schema:", err);
        setValidationStatusMessage(`Error loading schema: ${err.message}`);
      } finally {
        setIsSchemaLoading(false);
      }
    };
    fetchAndCompileSchema();
  }, [get, dataProductSchema]);

  // --- Tab Change and JSON Handling Logic ---

  // Function to validate a data product object against the schema
  const validateProductObject = (data: any) => {
    console.log("[validateProductObject] Starting validation...");
    if (!schemaValidator) {
      setValidationStatusMessage("Schema not loaded yet.");
      setIsJsonValid(false);
      setSchemaValidationErrors(null);
      return false;
    }
    const cleanedData = cleanEmptyOptionalStrings(data);
    console.log("[validateProductObject] Validating cleaned object:", cleanedData);
    const isValid = schemaValidator(cleanedData);
    if (isValid) {
       setValidationStatusMessage("Valid");
       setIsJsonValid(true);
       setSchemaValidationErrors(null);
       console.log("[validateProductObject] Result: VALID");
    } else {
       setIsJsonValid(false);
       setSchemaValidationErrors(schemaValidator.errors ?? []);
       const errorCount = schemaValidator.errors?.length ?? 0;
       setValidationStatusMessage(`${errorCount} schema validation error(s)`); 
       console.log(`[validateProductObject] Result: INVALID (${errorCount} errors)`);
    }
    return isValid;
  };

  const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log("[handleJsonChange] Fired");
    const currentJson = event.target.value;
    setJsonString(currentJson);
    setValidationStatusMessage(null); 
    setSchemaValidationErrors(null); 

    try {
      const parsedData = JSON.parse(currentJson);
      console.log("[handleJsonChange] JSON parsed successfully.");
      setIsJsonValid(true); 
      setJsonParseError(null);
      validateProductObject(parsedData);
    } catch (error: any) {      
      console.log("[handleJsonChange] JSON parsing failed.");
      setIsJsonValid(false);
      setJsonParseError(error.message);
      setValidationStatusMessage("Invalid JSON syntax");
      setSchemaValidationErrors(null);
    }
  };

  const handleTabChange = (newTab: 'ui' | 'json') => {
    if (newTab === activeTab) return;

    setJsonParseError(null);

    if (activeTab === 'ui' && newTab === 'json') {
      handleSubmit((formDataFromRHF) => {
         try {
           const currentMainLinksObject = linksArrayToObject(linksArray); 
           const currentMainCustomObject = arrayToObject(customArray);

           const dataForJsonRaw = {
             ...formDataFromRHF, 
             links: currentMainLinksObject, 
             custom: currentMainCustomObject,
           };

           const cleanedDataForJson = cleanEmptyOptionalStrings(dataForJsonRaw);

           const formattedJson = JSON.stringify(cleanedDataForJson, null, 2);
           setJsonString(formattedJson);
           setIsJsonValid(true);
           validateProductObject(cleanedDataForJson); 
           setActiveTab('json');
         } catch (err) {
           console.error("Error preparing JSON from UI state:", err);
           setJsonParseError("Failed to serialize UI state to JSON.");
         }
      })(); 

    } else if (activeTab === 'json' && newTab === 'ui') {
       try {
         const parsedData = JSON.parse(jsonString);
         if (!validateProductObject(parsedData)) {
             console.error("Cannot switch to UI tab: JSON fails schema validation.");
             // Show toast notification
             toast({ 
                 title: "Invalid JSON", 
                 description: "Cannot switch to UI editor. Please fix schema validation errors first.",
                 variant: "destructive"
             });
             return; 
         }
         setIsJsonValid(true);
         reset(parsedData);
         setLinksArray(linksObjectToArray(parsedData.links));
         setCustomArray(objectToArray(parsedData.custom));
         setActiveTab('ui');
       } catch (error: any) {
          console.error("Error parsing JSON:", error);
          setIsJsonValid(false);
          setJsonParseError(error.message);
       }
    }
  };
  
  const submitFromJson = async () => {
    setFormError(null);
    setJsonParseError(null);

    try {
      const parsedData = JSON.parse(jsonString);
      setIsJsonValid(true); 
      
      await onFormSubmit(parsedData); 

    } catch (error: any) {
      console.error("Error submitting JSON:", error);
      setIsJsonValid(false);
      setJsonParseError(`Invalid JSON: ${error.message}`);
    }
  };

  // --- Table Definition (Re-insert) --- 
  const columns: ColumnDef<DataProduct>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "info.title", 
      header: ({ column }: { column: Column<DataProduct, unknown> }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Title <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.info.title}</div>,
    },
    {
      accessorKey: "info.owner",
      header: ({ column }: { column: Column<DataProduct, unknown> }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Owner <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.info.owner}</div>,
    },
    {
      accessorKey: "info.archetype", 
      header: ({ column }: { column: Column<DataProduct, unknown> }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Archetype <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        row.original.info.archetype ? 
        <Badge variant="outline">{row.original.info.archetype}</Badge> : 'N/A'
      ),
      filterFn: 'includesString', 
    },
    {
      accessorKey: "info.status",
      header: ({ column }: { column: Column<DataProduct, unknown> }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        row.original.info.status ?
        <Badge variant={getStatusColor(row.original.info.status)}>{row.original.info.status}</Badge> : 'N/A'
      ),
      filterFn: 'equalsString', 
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      header: ({ column }: { column: Column<DataProduct, unknown> }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Created <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return <RelativeDate date={row.original.created_at} />;
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }: { column: Column<DataProduct, unknown> }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Updated <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return <RelativeDate date={row.original.updated_at} />;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            {product.id && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDeleteProduct(product.id!)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    filterFns: {
      includesString: (row, columnId, value) => {
        const rowValue = row.getValue(columnId);
        return String(rowValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
      },
      equalsString: (row, columnId, value) => {
         const rowValue = row.getValue(columnId);
         return String(rowValue ?? '') === String(value ?? '');
      }
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // --- Render Logic --- 
  return (
    <div className="container py-6">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <Database className="w-8 h-8" />
        Data Products
      </h1>

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2">
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
            <Button onClick={triggerFileUpload} className="gap-2" variant="outline" disabled={isUploading}>
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json,.yaml,.yml" 
              style={{ display: 'none' }} 
            />
         </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conditional Rendering for Loading State */} 
      {loading ? (
        <div className="flex justify-center items-center h-64">
           {/* Use Loader2 for consistency */}
          <Loader2 className="h-12 w-12 animate-spin text-primary" /> 
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Filter all columns..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace('.', ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Data Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between space-x-2 py-4">
             <div className="flex-1 text-sm text-muted-foreground">
               {table.getFilteredSelectedRowModel().rows.length} of{" "}
               {table.getFilteredRowModel().rows.length} row(s) selected.
             </div>
             <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value))
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount() ?? 0}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronDown className="h-4 w-4 rotate-90" /> 
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                     <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Button>
                </div>
              </div>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Data Product' : 'Create Data Product'}
            </DialogTitle>
            <DialogDescription>
                Fill in the details for the data product according to the specification.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'ui' | 'json')} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ui">UI Editor</TabsTrigger>
                <TabsTrigger value="json">JSON Editor</TabsTrigger>
              </TabsList>

              {/* UI Editor Tab */} 
               <TabsContent value="ui" className="mt-0">
                 <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    <ScrollArea className="h-[60vh]">
                       <div className="space-y-6 px-1 pr-6">
                            {/* ID and Spec Version */} 
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <Label htmlFor="productId">ID (auto-generated if empty on create)</Label>
                                 <Input id="productId" {...register("id")} placeholder="e.g., my-unique-product-id"/>
                                 {errors.id && <p className="text-sm text-red-600">{errors.id.message}</p>}
                               </div>
                               <div>
                                 <Label>Specification Version</Label>
                                 <Input value="0.0.1" readOnly disabled className="bg-muted"/>
                               </div>
                            </div>
                            
                            <Card>
                              <CardHeader>
                                <CardTitle>Info</CardTitle>
                                <CardDescription>Basic information about the data product.</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                     <Label htmlFor="info.title">Title *</Label>
                                     <Input id="info.title" {...register("info.title", { required: "Title is required" })} />
                                     {errors.info?.title && <p className="text-sm text-red-600">{errors.info.title.message}</p>}
                                   </div>
                                   <div>
                                     <Label htmlFor="info.owner">Owner *</Label>
                                      <Input 
                                        id="info.owner" 
                                        {...register("info.owner", { required: "Owner is required" })} 
                                      />
                                     {errors.info?.owner && <p className="text-sm text-red-600">{errors.info.owner.message}</p>}
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                     <Label htmlFor="info.domain">Domain</Label>
                                     {/* TODO: Fetch distinct domains if needed or use Input */}
                                     <Input id="info.domain" {...register("info.domain")} />
                                     {errors.info?.domain && <p className="text-sm text-red-600">{errors.info.domain.message}</p>}
                                   </div>
                                   <div>
                                     <Label htmlFor="info.archetype">Archetype</Label>
                                     <Controller
                                        name="info.archetype"
                                        control={control}
                                        render={({ field }) => (
                                          <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <SelectTrigger><SelectValue placeholder="Select archetype" /></SelectTrigger>
                                            <SelectContent>
                                              {archetypes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      />
                                      {errors.info?.archetype && <p className="text-sm text-red-600">{errors.info.archetype.message}</p>}
                                   </div>
                                </div>
                                <div>
                                  <Label htmlFor="info.description">Description</Label>
                                  <Textarea id="info.description" {...register("info.description")} />
                                  {errors.info?.description && <p className="text-sm text-red-600">{errors.info.description.message}</p>}
                                </div>
                                <div>
                                   <Label htmlFor="info.status">Status</Label>
                                   <Controller
                                      name="info.status"
                                      control={control}
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                          <SelectContent>
                                            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                    {errors.info?.status && <p className="text-sm text-red-600">{errors.info.status.message}</p>}
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                               <CardHeader>
                                  <CardTitle>Input Ports</CardTitle>
                                  <CardDescription>Define the sources feeding into this data product. Select tables from the metastore.</CardDescription>
                               </CardHeader>
                               <CardContent className="space-y-4">
                                  {inputPortFields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded space-y-3 relative">
                                        <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           className="absolute top-1 right-1 h-6 w-6" 
                                           onClick={() => removeInputPort(index)}
                                           type="button"> <X className="h-4 w-4" /> </Button>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor={`inputPorts.${index}.id`}>Port ID *</Label>
                                            <Input {...register(`inputPorts.${index}.id`, { required: "Port ID is required" })} />
                                            {errors.inputPorts?.[index]?.id && <p className="text-sm text-red-600">{errors.inputPorts[index].id.message}</p>}
                                          </div>
                                          <div>
                                              <Label htmlFor={`inputPorts.${index}.name`}>Port Name *</Label>
                                              <Input {...register(`inputPorts.${index}.name`, { required: "Port Name is required" })} />
                                              {errors.inputPorts?.[index]?.name && <p className="text-sm text-red-600">{errors.inputPorts[index].name.message}</p>}
                                          </div>
                                        </div>
                                        <div>
                                           <Label htmlFor={`inputPorts.${index}.sourceSystemId`}>Source Table (Metastore) *</Label>
                                           <Controller
                                              name={`inputPorts.${index}.sourceSystemId`}
                                              control={control}
                                              rules={{ required: "Source Table is required" }}
                                              render={({ field: controllerField }) => (
                                                 <Popover open={isComboboxOpen[index]} onOpenChange={(open) => handleComboboxOpenChange(open, index)}>
                                                    <PopoverTrigger asChild>
                                                       <Button
                                                          variant="outline"
                                                          role="combobox"
                                                          aria-expanded={isComboboxOpen[index]}
                                                          className="w-full justify-between"
                                                        >
                                                          {controllerField.value
                                                            ? tableSearchResults.find((table) => table.full_name === controllerField.value)?.full_name ?? controllerField.value // Show selected value
                                                            : "Select source table..."}
                                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                     </PopoverTrigger>
                                                     <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                                                        <Command shouldFilter={false} /* We handle filtering via API */>
                                                           <CommandInput 
                                                              placeholder="Search metastore tables..."
                                                              value={tableSearchQuery} 
                                                              onValueChange={handleTableSearchInputChange}
                                                           />
                                                           <CommandList>
                                                              <CommandEmpty>
                                                                  {isSearchingTables ? "Searching..." : "No tables found."}
                                                              </CommandEmpty>
                                                              <CommandGroup>
                                                                 {tableSearchResults.map((table) => (
                                                                    <CommandItem
                                                                       key={table.full_name}
                                                                       value={table.full_name} // value for selection
                                                                       onSelect={(currentValue) => {
                                                                           controllerField.onChange(currentValue === controllerField.value ? "" : currentValue)
                                                                           handleComboboxOpenChange(false, index) // Close popover on select
                                                                       }}
                                                                    >
                                                                       <Check
                                                                          className={cn(
                                                                             "mr-2 h-4 w-4",
                                                                             controllerField.value === table.full_name ? "opacity-100" : "opacity-0"
                                                                          )}
                                                                        />
                                                                        {table.full_name}
                                                                     </CommandItem>
                                                                  ))}
                                                              </CommandGroup>
                                                           </CommandList>
                                                         </Command>
                                                      </PopoverContent>
                                                   </Popover>
                                              )}
                                            />
                                            {errors.inputPorts?.[index]?.sourceSystemId && <p className="text-sm text-red-600">{errors.inputPorts[index].sourceSystemId.message}</p>}
                                            {/* Add hidden input to set default type for input port */} 
                                            <input type="hidden" {...register(`inputPorts.${index}.type`, { value: 'table' })} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`inputPorts.${index}.description`}>Description</Label>
                                            <Textarea {...register(`inputPorts.${index}.description`)} />
                                        </div>

                                        {/* TODO: Input Port Tags, Links, Custom */} 
                                        <div className="grid grid-cols-2 gap-4">
                                           <div>
                                             <Label htmlFor={`inputPorts.${index}.tags`}>Tags</Label>
                                              <Controller
                                                  name={`inputPorts.${index}.tags`}
                                                  control={control}
                                                  render={({ field }) => (
                                                     <Input 
                                                         placeholder="Comma-separated tags"
                                                         value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                                         onChange={(e) => {
                                                             const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                                                             field.onChange(tags);
                                                         }}
                                                     />
                                                  )}
                                              />
                                           </div>
                                        </div>
                                        {/* Render the sub-component for links/custom */}
                                        <PortMetadataEditor 
                                            control={control} 
                                            register={register} 
                                            getValues={getValues}
                                            setValue={setValue}
                                            portIndex={index} 
                                            portType="inputPorts" 
                                        />

                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeInputPort(index)} className="absolute top-2 right-2 text-destructive" title="Remove Input Port">
                                          <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                  ))}
                                  <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={() => appendInputPort({ 
                                          // Default Input Port values
                                          id: `input-${inputPortFields.length + 1}`,
                                          name: '',
                                          sourceSystemId: '',
                                          type: 'table', // Explicitly set default type
                                          links: {},
                                          custom: {},
                                          tags: []
                                      })}
                                    > 
                                      <Plus className="mr-2 h-4 w-4"/> Add Input Port 
                                  </Button>
                               </CardContent>
                            </Card>

                            <Card>
                               <CardHeader>
                                  <CardTitle>Output Ports</CardTitle>
                                   <CardDescription>Define the outputs provided by this data product.</CardDescription>
                               </CardHeader>
                               <CardContent className="space-y-4">
                                   {outputPortFields.map((field, index) => (
                                     <div key={field.id} className="p-4 border rounded space-y-3 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeOutputPort(index)} type="button"> <X className="h-4 w-4" /> </Button>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor={`outputPorts.${index}.id`}>Port ID *</Label>
                                            <Input {...register(`outputPorts.${index}.id`, { required: "Port ID is required" })} />
                                            {errors.outputPorts?.[index]?.id && <p className="text-sm text-red-600">{errors.outputPorts[index].id.message}</p>}
                                          </div>
                                          <div>
                                              <Label htmlFor={`outputPorts.${index}.name`}>Port Name *</Label>
                                              <Input {...register(`outputPorts.${index}.name`, { required: "Port Name is required" })} />
                                              {errors.outputPorts?.[index]?.name && <p className="text-sm text-red-600">{errors.outputPorts[index].name.message}</p>}
                                          </div>
                                        </div>
                                        <div>
                                            <Label htmlFor={`outputPorts.${index}.description`}>Description</Label>
                                            <Textarea {...register(`outputPorts.${index}.description`)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                           <div>
                                              <Label htmlFor={`outputPorts.${index}.type`}>Type</Label>
                                              <Input {...register(`outputPorts.${index}.type`)} placeholder="e.g., table, view, api"/>
                                           </div>
                                           <div>
                                              <Label htmlFor={`outputPorts.${index}.status`}>Status</Label>
                                               <Controller
                                                  name={`outputPorts.${index}.status`}
                                                  control={control}
                                                  render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                                      <SelectContent>
                                                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                      </SelectContent>
                                                    </Select>
                                                  )}
                                                />
                                           </div>
                                        </div>
                                         {/* Render the sub-component for links/custom */}
                                         <PortMetadataEditor 
                                             control={control} 
                                             register={register} 
                                             getValues={getValues}
                                             setValue={setValue}
                                             portIndex={index} 
                                             portType="outputPorts" 
                                         />

                                         <Button type="button" variant="ghost" size="icon" onClick={() => removeOutputPort(index)} className="absolute top-2 right-2 text-destructive" title="Remove Output Port">
                                            <X className="h-4 w-4" />
                                         </Button>
                                     </div>
                                   ))}
                                   <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => appendOutputPort({ 
                                        // Default Output Port values
                                        id: `output-${outputPortFields.length + 1}`, 
                                        name: '', 
                                        type: 'table', // Explicitly set default type
                                        containsPii: false, 
                                        autoApprove: false,
                                        links: {},
                                        custom: {},
                                        tags: [] 
                                     })}
                                   > 
                                     <Plus className="mr-2 h-4 w-4"/> Add Output Port 
                                   </Button>
                               </CardContent>
                            </Card>

                            {/* Tags Section (Main Product) */}
                            <Card>
                              <CardHeader>
                                <CardTitle>Tags</CardTitle>
                                <CardDescription>Add relevant tags (comma-separated).</CardDescription>
                              </CardHeader>
                              <CardContent>
                                 <Controller
                                      name="tags"
                                      control={control}
                                      render={({ field }) => (
                                         <Input 
                                             placeholder="e.g., finance, customer, pii"
                                             value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                             onChange={(e) => {
                                                 const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                                                 field.onChange(tags);
                                             }}
                                         />
                                      )}
                                  />
                              </CardContent>
                            </Card>

                            {/* Links Section (Main Product) */}
                            <Card>
                               <CardHeader>
                                   <CardTitle>Links</CardTitle>
                                   <CardDescription>Add relevant links (e.g., documentation, dashboards).</CardDescription>
                               </CardHeader>
                               <CardContent className="space-y-3">
                                   {linksArray.map((link, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                         <Input 
                                             placeholder="Link Key (e.g., docs)" 
                                             value={link.key}
                                             onChange={(e) => {
                                                 const newLinks = [...linksArray];
                                                 newLinks[index].key = e.target.value;
                                                 setLinksArray(newLinks);
                                             }}
                                             className="flex-1"
                                         />
                                         <Input 
                                             placeholder="URL *" 
                                             value={link.url}
                                              onChange={(e) => {
                                                 const newLinks = [...linksArray];
                                                 newLinks[index].url = e.target.value;
                                                 setLinksArray(newLinks);
                                             }}
                                             className="flex-1"
                                         />
                                         <Input 
                                             placeholder="Description" 
                                             value={link.description}
                                              onChange={(e) => {
                                                 const newLinks = [...linksArray];
                                                 newLinks[index].description = e.target.value;
                                                 setLinksArray(newLinks);
                                             }}
                                             className="flex-1"
                                         />
                                         <Button 
                                             type="button" 
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={() => setLinksArray(linksArray.filter((_, i) => i !== index))}
                                             className="text-destructive"
                                             title="Remove Link">
                                             <X className="h-4 w-4" />
                                         </Button>
                                      </div>
                                   ))}
                                   <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={() => setLinksArray([...linksArray, { key: '', url: '', description: '' }])}>
                                      <Plus className="mr-2 h-4 w-4"/> Add Link
                                   </Button>
                               </CardContent>
                            </Card>
                            
                            {/* Custom Properties Section (Main Product) */}
                             <Card>
                               <CardHeader>
                                   <CardTitle>Custom Properties</CardTitle>
                                   <CardDescription>Add custom key-value metadata.</CardDescription>
                               </CardHeader>
                               <CardContent className="space-y-3">
                                    {customArray.map((custom, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                         <Input 
                                             placeholder="Property Key" 
                                             value={custom.key}
                                             onChange={(e) => {
                                                 const newCustom = [...customArray];
                                                 newCustom[index].key = e.target.value;
                                                 setCustomArray(newCustom);
                                             }}
                                             className="flex-1"
                                         />
                                         <Input 
                                             placeholder="Property Value" 
                                             value={custom.value} // Treat as string for now
                                              onChange={(e) => {
                                                 const newCustom = [...customArray];
                                                 newCustom[index].value = e.target.value;
                                                 setCustomArray(newCustom);
                                             }}
                                             className="flex-1"
                                         />
                                         <Button 
                                             type="button" 
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={() => setCustomArray(customArray.filter((_, i) => i !== index))}
                                             className="text-destructive"
                                             title="Remove Property">
                                             <X className="h-4 w-4" />
                                         </Button>
                                      </div>
                                   ))}
                                   <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={() => setCustomArray([...customArray, { key: '', value: '' }])}>
                                      <Plus className="mr-2 h-4 w-4"/> Add Custom Property
                                   </Button>
                               </CardContent>
                            </Card>

                        </div>
                     </ScrollArea>
                     
                     {formError && (
                        <Alert variant="destructive">
                           <AlertCircle className="h-4 w-4" />
                           <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                      )}

                     <DialogFooter>
                       <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
                       <Button type="submit" disabled={isSubmitting}>
                         {isSubmitting ? "Saving..." : (selectedProduct ? 'Update Product' : 'Create Product')}
                       </Button>
                     </DialogFooter>
                 </form>
               </TabsContent>

               {/* JSON Editor Tab */} 
                <TabsContent value="json" className="mt-0">
                   <div className="space-y-2">
                      <Label htmlFor="jsonEditor">JSON Payload</Label>
                      <Textarea
                          id="jsonEditor"
                          value={jsonString}
                          onChange={handleJsonChange}
                          rows={25} // Adjust height as needed
                          className={cn(
                              "font-mono text-sm",
                              !isJsonValid && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder='Enter valid JSON for the Data Product...'
                       />
                       {/* Display Parse Error OR Validation Status Summary */}
                       {jsonParseError ? (
                          <p className="text-sm text-destructive">Syntax Error: {jsonParseError}</p>
                       ) : validationStatusMessage && (
                          <p className={cn(
                             "text-sm mt-1", 
                             isJsonValid ? "text-green-600" : "text-destructive"
                          )}>
                            Validation Status: {validationStatusMessage}
                          </p>
                       )}
                       {/* Collapsible Area for Detailed Errors */}
                       {!isJsonValid && schemaValidationErrors && schemaValidationErrors.length > 0 && (
                           <Accordion type="single" collapsible className="w-full mt-2">
                             <AccordionItem value="item-1">
                               <AccordionTrigger className="text-sm text-destructive hover:no-underline">
                                   Show {schemaValidationErrors.length} validation details
                               </AccordionTrigger>
                               <AccordionContent>
                                 {/* Wrap preformatted errors in a scrollable area */}
                                 <ScrollArea className="max-h-[200px] w-full rounded-md border overflow-y-auto"> 
                                    {/* Add an inner div for padding and direct content wrapping */}
                                    <div className="p-3"> 
                                        <pre className="text-xs bg-muted text-destructive whitespace-pre-wrap break-all">
                                            {JSON.stringify(schemaValidationErrors, null, 2)}
                                        </pre>
                                    </div>
                                 </ScrollArea>
                               </AccordionContent>
                             </AccordionItem>
                           </Accordion>
                       )}
                   </div>
                    {/* Footer for JSON Tab */}
                    <DialogFooter className="mt-4">
                     <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
                     <Button 
                        type="button" 
                        onClick={submitFromJson}
                        disabled={isSubmitting || !isJsonValid}
                      >
                        {isSubmitting ? "Saving..." : (selectedProduct ? 'Update Product' : 'Create Product')}
                   </Button>
                 </DialogFooter>
                </TabsContent>
           </Tabs>
        </DialogContent>
      </Dialog>

      {/* Render Toaster component (ideally place in root layout) */}
      <Toaster />
    </div>
  );
} 