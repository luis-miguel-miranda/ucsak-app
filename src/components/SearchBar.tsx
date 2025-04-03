import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Search, FileText, Database, Book, Shield, Settings, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface SearchResult {
  id: string;
  type: 'data-product' | 'data-contract' | 'glossary-term' | 'persona';
  title: string;
  description: string;
  link: string;
}

interface SearchBarProps {
  variant?: 'default' | 'large';
  placeholder?: string;
}

export default function SearchBar({ variant = 'default', placeholder = 'Search...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'data-product':
        return <Database className="h-4 w-4" />;
      case 'data-contract':
        return <FileText className="h-4 w-4" />;
      case 'glossary-term':
        return <Book className="h-4 w-4" />;
      case 'persona':
        return <Shield className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className={cn(
        "relative",
        variant === 'large' ? "w-full max-w-2xl mx-auto" : "w-full"
      )}>
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full",
            variant === 'large' ? "h-12 text-lg" : "h-10"
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (query.trim() || results.length > 0) && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {results.map((result) => (
                  <Button
                    key={result.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 p-2 h-auto"
                    onClick={() => handleResultClick(result)}
                  >
                    {getIcon(result.type)}
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{result.title}</span>
                      <span className="text-sm text-muted-foreground">{result.description}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No results found
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
} 