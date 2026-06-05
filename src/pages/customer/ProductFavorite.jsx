import React from "react";
import ConfirmationModal from "../../features/orders/components/ConfirmationModal";
import { useFavorites } from "../../features/products/hooks/useFavorites";
import ProductGridLayout from "../../components/layout/ProductGridLayout";

const ProductFavorite = () => {
  const {
    favorites,
    loading,
    error,
    showDeleteConfirm,
    setShowDeleteConfirm,
    favoriteToDelete,
    setFavoriteToDelete,
    handleDeleteFavoriteClick,
    handleDeleteFavorite,
    handleRetry
  } = useFavorites();

  return (
    <>
      <ProductGridLayout
        title="Your Favorite Products"
        rawProducts={favorites}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        isFavoritesPage={true}
        syncToUrl={false}
        handleRemoveFavorite={handleDeleteFavoriteClick}
        showSearch={true}
      />

      {/* Confirmation Modal for Removing Favorite */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Remove from Favorites"
        message={
          favoriteToDelete?.favorite?.productId
            ? `Are you sure you want to remove "${favoriteToDelete.favorite.productId.productName || "this product"}" from your favorites?`
            : "Are you sure you want to remove this product from your favorites?"
        }
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteFavorite}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setFavoriteToDelete(null);
        }}
      />
    </>
  );
};
export default ProductFavorite;