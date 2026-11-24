import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIcon } from '@/lib/utils';

/**
 * Custom hook for user category management.
 */
export function useCategories() {
  const { user } = useAuth() || {};
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches the user's categories ordered by is_default descending, then name ascending.
   * 
   * @returns {Promise<Array>} List of categories
   */
  const fetchCategories = useCallback(async () => {
    if (!user?.id) {
      setCategories([]);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (fetchErr) throw fetchErr;

      setCategories(data || []);
      return data || [];
    } catch (err) {
      const message = err.message || 'Failed to fetch categories';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Creates a new custom category (is_default = false).
   * 
   * @param {string} name - Category name
   * @param {string} [icon] - Lucide icon name (defaults based on category name or 'Folder')
   * @returns {Promise<Object>} Created category
   */
  const createCategory = useCallback(
    async (name, icon) => {
      if (!user?.id) throw new Error('You must be signed in to create a category');
      if (!name || !name.trim()) throw new Error('Category name is required');

      const trimmedName = name.trim();
      const resolvedIcon = icon || getCategoryIcon(trimmedName) || 'Folder';

      setLoading(true);
      setError(null);
      try {
        const insertPayload = {
          user_id: user.id,
          name: trimmedName,
          is_default: false,
          icon: resolvedIcon,
        };

        let { data, error: insertErr } = await supabase
          .from('categories')
          .insert([insertPayload])
          .select()
          .single();

        // Resilient fallback if table schema lacks icon or is_default
        if (insertErr && (insertErr.message?.includes('icon') || insertErr.message?.includes('is_default'))) {
          const fallbackRes = await supabase
            .from('categories')
            .insert([{ user_id: user.id, name: trimmedName }])
            .select()
            .single();
          data = fallbackRes.data;
          insertErr = fallbackRes.error;
        }

        if (insertErr) throw insertErr;

        setCategories((prev) => [...prev, data]);
        return data;
      } catch (err) {
        const message = err.message || 'Failed to create category';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Deletes a custom category. Default categories cannot be deleted.
   * 
   * @param {string} id - Category UUID
   * @returns {Promise<boolean>} True on success
   */
  const deleteCategory = useCallback(
    async (id) => {
      if (!id) throw new Error('Category ID is required');
      if (!user?.id) throw new Error('You must be signed in to delete a category');

      const targetCat = categories.find((c) => c.id === id);
      if (targetCat && targetCat.is_default) {
        const msg = 'Default categories cannot be deleted.';
        setError(msg);
        throw new Error(msg);
      }

      setLoading(true);
      setError(null);
      try {
        const { error: delErr } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
          .eq('is_default', false);

        if (delErr) throw delErr;

        setCategories((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch (err) {
        const message = err.message || 'Failed to delete category';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [categories, user?.id]
  );

  // Auto-fetch categories when authenticated user is available
  useEffect(() => {
    if (user?.id) {
      fetchCategories().catch((err) => {
        console.error('Initial categories fetch failed:', err);
      });
    } else {
      setCategories([]);
    }
  }, [user?.id, fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    deleteCategory,
  };
}

export default useCategories;
