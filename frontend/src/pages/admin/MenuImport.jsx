import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Alert,
  Box,
  Button,
  Card,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import ImageSearchRoundedIcon from '@mui/icons-material/ImageSearchRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { getApiUrl } from '../../config/api';

const exampleText = `Chicken 65 | 15 | Starter | Crispy fried chicken
Butter Chicken | 18 | Main Course | Creamy tomato curry
Lime Soda | 5 | Drinks | Fresh citrus cooler`;

const defaultCategories = ['Starter', 'Main Course', 'Drinks', 'Dessert', 'Snack'];
const TESSERACT_CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
const NEW_CATEGORY_VALUE = '__new__';

const loadTesseractScript = () =>
  new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }

    const existingScript = document.querySelector(`script[src="${TESSERACT_CDN_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Tesseract), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load OCR engine')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = TESSERACT_CDN_URL;
    script.async = true;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Failed to load OCR engine'));
    document.body.appendChild(script);
  });

const cleanExtractedText = (rawText = '') => {
  const normalized = rawText
    .replace(/\r/g, '\n')
    .replace(/[\u2022\u25CF\u25AA\u25E6\u00B7]/g, ' ')
    .replace(/[\u201C\u201D"]/g, '')
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[^\w\s|,.\-:/&()+₹$]/g, ' ')
    .replace(/[|]{2,}/g, '|')
    .replace(/-{3,}/g, '-')
    .replace(/[ ]{2,}/g, ' ');

  const lines = normalized
    .split('\n')
    .map((line) =>
      line
        .replace(/\s*\|\s*/g, ' | ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*-\s*/g, ' - ')
        .replace(/[ ]{2,}/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .filter((line) => /[a-zA-Z]/.test(line))
    .filter((line) => !/^[₹$]?\s*\d+([.,]\d+)?$/.test(line))
    .filter((line) => line.replace(/[^a-zA-Z]/g, '').length >= 3);

  const merged = [];
  for (const line of lines) {
    const previous = merged[merged.length - 1];
    const looksLikeContinuation =
      previous &&
      !/(\||,| - |\d)/.test(previous) &&
      !/(\||,| - |\d)/.test(line) &&
      previous.length < 28;

    if (looksLikeContinuation) {
      merged[merged.length - 1] = `${previous} ${line}`.replace(/[ ]{2,}/g, ' ').trim();
      continue;
    }

    merged.push(line);
  }

  return merged.join('\n');
};

const normalizePreviewItem = (item, categoryOptions) => {
  const category = String(item.category || 'Main Course').trim() || 'Main Course';
  const matchesExisting = categoryOptions.includes(category);

  return {
    ...item,
    category,
    _categoryMode: matchesExisting ? 'select' : 'new',
    _newCategory: matchesExisting ? '' : category,
  };
};

export default function MenuImport() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sourceText, setSourceText] = useState(exampleText);
  const [previewItems, setPreviewItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [ocrReady, setOcrReady] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(true);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([...defaultCategories, ...categories]))
        .map((category) => category.trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [categories]
  );

  useEffect(() => {
    let active = true;

    loadTesseractScript()
      .then(() => {
        if (active) {
          setOcrReady(true);
          setOcrLoading(false);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'OCR engine could not be loaded');
          setOcrLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(getApiUrl('/api/categories'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => []);
        if (response.ok) {
          setCategories(Array.isArray(data) ? data.map((category) => category.name) : []);
        }
      } catch (loadError) {
        console.error(loadError);
      }
    };

    loadCategories();
  }, [token]);

  const handleTextFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setSourceText(cleanExtractedText(text));
    setUploadedImageName('');
    setUploadedImagePreview('');
    setError('');
    setSuccess('Loaded text file. Review the cleaned text and generate a preview when ready.');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ocrReady || !window.Tesseract) {
      setError('OCR engine is still loading. Please wait a moment and try again.');
      return;
    }

    setIsExtractingImage(true);
    setError('');
    setSuccess('');
    setOcrProgress(0);
    setUploadedImageName(file.name);

    const imageUrl = URL.createObjectURL(file);
    setUploadedImagePreview(imageUrl);

    try {
      const result = await window.Tesseract.recognize(file, 'eng', {
        logger: (message) => {
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            setOcrProgress(Math.round(message.progress * 100));
          }
        },
      });

      const extractedText = cleanExtractedText(result?.data?.text?.trim() || '');
      if (!extractedText) {
        throw new Error('No readable menu text was found after cleaning the uploaded image.');
      }

      setSourceText(extractedText);
      setSuccess('Text extracted and cleaned from the image. Review it and generate the menu preview.');
    } catch (ocrError) {
      console.error(ocrError);
      setError(ocrError.message || 'Failed to extract text from the uploaded image.');
    } finally {
      setIsExtractingImage(false);
    }
  };

  const handleGeneratePreview = async () => {
    setLoadingPreview(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(getApiUrl('/api/menu/import/preview'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceText: cleanExtractedText(sourceText) }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to parse menu');
      }

      setPreviewItems(
        (data.items || []).map((item) => normalizePreviewItem(item, categoryOptions))
      );
      setSuccess(`Parsed ${data.items.length} menu items. Review them before import.`);
    } catch (previewError) {
      setError(previewError.message || 'Failed to parse menu');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    setPreviewItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleCategorySelect = (index, value) => {
    setPreviewItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (value === NEW_CATEGORY_VALUE) {
          return {
            ...item,
            _categoryMode: 'new',
            _newCategory: item._newCategory || '',
          };
        }

        return {
          ...item,
          category: value,
          _categoryMode: 'select',
          _newCategory: '',
        };
      })
    );
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const sanitizedItems = previewItems.map((item) => ({
        ...item,
        category:
          item._categoryMode === 'new'
            ? String(item._newCategory || '').trim()
            : String(item.category || '').trim(),
      }));

      if (sanitizedItems.some((item) => !item.category)) {
        throw new Error('Please select or add a category for every imported item.');
      }

      const response = await fetch(getApiUrl('/api/menu/import/commit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: sanitizedItems.map(({ _categoryMode, _newCategory, ...item }) => item),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to import menu items');
      }

      setSuccess(`Imported ${data.importedCount} menu items successfully.`);
      setTimeout(() => navigate('/admin/menu'), 900);
    } catch (importError) {
      setError(importError.message || 'Failed to import menu items');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Menu Import
        </Typography>
        <Typography variant="subtitle1">
          Upload a menu image or text file, clean the extracted text, review parsed items, and import them into Menu Items.
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
        <Stack spacing={2.5}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          <Box>
            <Typography variant="h6" sx={{ mb: 0.75 }}>
              Image OCR Import
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              Upload a menu image and the OCR engine will extract and clean the text before preview.
            </Typography>
          </Box>

          {ocrLoading ? (
            <Alert severity="info">Loading OCR engine for image-based menu import...</Alert>
          ) : (
            <Alert severity={ocrReady ? 'success' : 'warning'}>
              {ocrReady
                ? 'OCR engine is ready. You can upload menu photos or scans.'
                : 'OCR engine is unavailable right now. Text and file imports still work.'}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<ImageSearchRoundedIcon />}
              disabled={!ocrReady || isExtractingImage}
            >
              {isExtractingImage ? 'Extracting from image...' : 'Upload menu image'}
              <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
            </Button>
            <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />}>
              Upload txt/csv/json
              <input hidden accept=".txt,.csv,.json" type="file" onChange={handleTextFileUpload} />
            </Button>
          </Stack>

          {isExtractingImage ? (
            <Box>
              <LinearProgress
                variant="determinate"
                value={ocrProgress}
                sx={{ height: 8, borderRadius: '999px' }}
              />
              <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 13 }}>
                OCR progress: {ocrProgress}%
              </Typography>
            </Box>
          ) : null}

          {uploadedImagePreview ? (
            <Card sx={{ backgroundColor: '#221F1C', borderRadius: '18px', p: 2 }}>
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 700 }}>
                  Uploaded image: {uploadedImageName || 'menu image'}
                </Typography>
                <Box
                  component="img"
                  src={uploadedImagePreview}
                  alt={uploadedImageName || 'Uploaded menu'}
                  sx={{
                    width: '100%',
                    maxHeight: 320,
                    objectFit: 'contain',
                    borderRadius: '14px',
                    backgroundColor: '#181411',
                  }}
                />
              </Stack>
            </Card>
          ) : null}

          <Typography variant="h6">Review Cleaned Text</Typography>
          <TextField
            multiline
            minRows={10}
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Example: Chicken 65 | 15 | Starter | Crispy fried chicken"
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeRoundedIcon />}
              onClick={handleGeneratePreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? 'Parsing...' : 'Generate Preview'}
            </Button>
            <Button variant="outlined" onClick={() => setSourceText(cleanExtractedText(sourceText))}>
              Clean Text Again
            </Button>
          </Stack>
        </Stack>
      </Card>

      {previewItems.length ? (
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="h6">Review Imported Items</Typography>

            <Stack spacing={2}>
              {previewItems.map((item, index) => (
                <Card
                  key={`${item.name}-${index}`}
                  sx={{ backgroundColor: '#221F1C', borderRadius: '18px', p: 2.5 }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Name"
                      value={item.name}
                      onChange={(event) => handleItemChange(index, 'name', event.target.value)}
                    />
                    <TextField
                      label="Price"
                      type="number"
                      value={item.price}
                      onChange={(event) =>
                        handleItemChange(index, 'price', Number(event.target.value))
                      }
                    />
                    <FormControl>
                      <InputLabel>Category</InputLabel>
                      <Select
                        label="Category"
                        value={item._categoryMode === 'new' ? NEW_CATEGORY_VALUE : item.category}
                        onChange={(event) => handleCategorySelect(index, event.target.value)}
                      >
                        {categoryOptions.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                        <MenuItem value={NEW_CATEGORY_VALUE}>Add new category</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Description"
                      value={item.description}
                      onChange={(event) =>
                        handleItemChange(index, 'description', event.target.value)
                      }
                    />
                    {item._categoryMode === 'new' ? (
                      <TextField
                        label="New Category"
                        value={item._newCategory}
                        onChange={(event) =>
                          setPreviewItems((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    _newCategory: event.target.value,
                                    category: event.target.value,
                                  }
                                : entry
                            )
                          )
                        }
                        placeholder="Enter category name"
                      />
                    ) : null}
                  </Box>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(item.isVeg)}
                          onChange={(event) =>
                            handleItemChange(index, 'isVeg', event.target.checked)
                          }
                        />
                      }
                      label="Vegetarian"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(item.isPopular)}
                          onChange={(event) =>
                            handleItemChange(index, 'isPopular', event.target.checked)
                          }
                        />
                      }
                      label="Popular"
                    />
                  </Stack>
                </Card>
              ))}
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import to Menu Items'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
