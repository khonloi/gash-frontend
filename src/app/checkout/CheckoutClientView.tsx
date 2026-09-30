'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import { PaymentMethod, ShippingMethod } from '@/types/order';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { CheckoutFormData, CheckoutFormErrors, OrderConfirmationData } from '@/constants/checkout';
import { validateCheckoutForm } from '@/lib/validation';
import { CheckoutForm, CheckoutSummary, OrderConfirmation } from '@/components/checkout';
import styles from './page.module.css';

export function CheckoutClientView() {
  const { items, getTotalPrice } = useCartStore();
  const { addToast } = useToastStore();
  const { placeOrder } = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();
  const mounted = useIsMounted();

  const [formData, setFormData] = useState<CheckoutFormData>(() => ({
    contact: user?.email || user?.phone || '',
    country: user?.addresses?.find((a) => a.isDefault)?.country || 'Vietnam',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: user?.addresses?.find((a) => a.isDefault)?.addressLine1 || '',
    apartment: user?.addresses?.find((a) => a.isDefault)?.addressLine2 || '',
    city: user?.addresses?.find((a) => a.isDefault)?.city || '',
    postalCode: user?.addresses?.find((a) => a.isDefault)?.postalCode || '',
    phone: user?.phone || '',
    keepUpdated: false,
  }));

  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmationData | null>(null);

  const subtotal = getTotalPrice();
  const shippingFee =
    subtotal > 0 && shippingMethod === 'standard' ? 30 : shippingMethod === 'express' ? 50 : 0;
  const total = subtotal + shippingFee;

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for that field as user types
    if (errors[field as keyof CheckoutFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateCheckoutForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      addToast('Please correct the errors in the form before continuing.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(formData.contact.trim());

      const createdOrder = await placeOrder({
        shippingAddress: {
          fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          phone: formData.phone.trim(),
          addressLine1: formData.address.trim(),
          addressLine2: formData.apartment.trim() || undefined,
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim() || undefined,
          country: formData.country.trim() || 'Vietnam',
        },
        shippingMethod: shippingMethod as ShippingMethod,
        paymentMethod: paymentMethod as PaymentMethod,
        contactEmail: isEmail ? formData.contact.trim() : user?.email,
        contactPhone: !isEmail ? formData.contact.trim() : formData.phone.trim(),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
      });

      const confirmedOrder: OrderConfirmationData = {
        orderId: createdOrder.orderNumber,
        date: new Date(createdOrder.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        customerName: createdOrder.shippingAddress.fullName,
        shippingAddress: `${createdOrder.shippingAddress.addressLine1}${
          createdOrder.shippingAddress.addressLine2
            ? ', ' + createdOrder.shippingAddress.addressLine2
            : ''
        }, ${createdOrder.shippingAddress.city}, ${createdOrder.shippingAddress.country}`,
        total: createdOrder.total,
        itemCount: createdOrder.itemCount || items.reduce((sum, i) => sum + i.quantity, 0),
      };

      setCompletedOrder(confirmedOrder);
      addToast(`Order ${createdOrder.orderNumber} placed successfully!`, 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred while placing your order. Please try again.';
      addToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SSR Loading Skeleton
  if (!mounted) {
    return (
      <div className={styles.checkoutPage}>
        <div className="container">
          <div className={styles.checkoutContainer}>
            <div className={styles.leftColumn}>
              <div className={styles.formSkeletonWrapper}>
                <Skeleton className={styles.formTitleSkeleton} />
                <Skeleton className={styles.inputFieldSkeleton} />
                <div className={styles.twoColRow}>
                  <Skeleton className={styles.inputFieldSkeleton} />
                  <Skeleton className={styles.inputFieldSkeleton} />
                </div>
                <Skeleton className={styles.inputFieldSkeleton} />
                <div className={styles.twoColRow}>
                  <Skeleton className={styles.inputFieldSkeleton} />
                  <Skeleton className={styles.inputFieldSkeleton} />
                </div>
                <Skeleton className={styles.inputFieldSkeleton} />
                <Skeleton className={styles.buttonSkeleton} />
              </div>
            </div>
            <div className={styles.rightColumn}>
              <div className={styles.summarySkeletonWrapper}>
                <Skeleton className={styles.summaryTitleSkeleton} />
                <Skeleton className={styles.summaryItemSkeleton} />
                <Skeleton className={styles.summaryItemSkeleton} />
                <div className={styles.dividerSkeleton} />
                <Skeleton className={styles.summaryRowSkeleton} />
                <Skeleton className={styles.summaryRowSkeleton} />
                <Skeleton className={styles.summaryTotalSkeleton} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order Confirmation Screen
  if (completedOrder) {
    return <OrderConfirmation order={completedOrder} />;
  }

  // Empty cart fallback
  if (items.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className="container">
          <EmptyState
            icon={<ShoppingBag size={64} />}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet."
            action={
              <Button as={Link} href="/" variant="primary" size="lg">
                Continue Shopping
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className="container">
        <form onSubmit={handleOrderSubmit} className={styles.checkoutContainer}>
          <CheckoutForm
            formData={formData}
            errors={errors}
            shippingMethod={shippingMethod}
            paymentMethod={paymentMethod}
            isSubmitting={isSubmitting}
            isAuthenticated={isAuthenticated}
            total={total}
            onInputChange={handleInputChange}
            onShippingChange={setShippingMethod}
            onPaymentChange={setPaymentMethod}
            onSubmit={handleOrderSubmit}
          />

          <CheckoutSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
          />
        </form>
      </div>
    </div>
  );
}
