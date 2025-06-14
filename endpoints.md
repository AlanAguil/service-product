## Productos

```java
// ADMIN
@GetMapping("/admin/product/all") // Consulta otras tablas: Sí (productos)
public ResponseEntity<Message> getAllProducts() {
    return productService.findAll();
}

@GetMapping("/admin/product/preview/all") // Consulta otras tablas: Sí (productos)
public ResponseEntity<Message> getProductsPreview() {
    return productService.findPreviewAll();
}

@GetMapping("/admin/product/{id}") // Consulta otras tablas: Sí (productos)
public ResponseEntity<Message> getProductById(@PathVariable Integer id) {
    return productService.findById(id);
}

@PostMapping("/admin/product/create") // Consulta otras tablas: Sí (productos, posiblemente marcas y categorías)
public ResponseEntity<Message> save(@Validated(ProductDto.Create.class) @RequestBody ProductDto dto) {
    return productService.create(dto);
}

@PutMapping("/admin/product/update") // Consulta otras tablas: Sí (productos)
public ResponseEntity<Message> update(@Validated(ProductDto.Update.class) @RequestBody ProductDto dto) {
    return productService.update(dto);
}

// PUBLIC
@GetMapping("/public/product/brand/{brandId}") // Consulta otras tablas: Sí (productos, marcas)
public ResponseEntity<Message> getProductsByBrandIdAndStatusActive(@PathVariable Integer brandId) {
    return productService.findByBrandIdAndStatusActive(brandId);
}

@GetMapping("/public/product/category/{categoryId}/brand/{brandId}") // Consulta otras tablas: Sí (productos, categorías, marcas)
public ResponseEntity<Message> getProductsByCategoryIdAndBrandIdAndStatusActive(
        @PathVariable Integer categoryId,
        @PathVariable Integer brandId) {
    return productService.findByCategoryIdAndBrandIdAndStatusActive(categoryId, brandId);
}

@GetMapping("/public/product/{id}") // Consulta otras tablas: Sí (productos)
public ResponseEntity<Message> getProductById(@PathVariable Integer id) {
    return productService.findByIdAndStatusActive(id);
}

@GetMapping("/public/products") // Consulta otras tablas: Sí (productos)
public ResponseEntity<Message> getAllProducts() {
    return productService.findAllActive();
}

```

## sparePart

```java

// ADMIN
@GetMapping("/admin/sparePart/all") // Consulta otras tablas: Sí (refacciones)
public ResponseEntity<Message> getAllActives(@RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size) {
    return sparePartService.findAllActives(page, size);
}

@GetMapping("/admin/sparePart/{id}") // Consulta otras tablas: Sí (refacciones)
public ResponseEntity<Message> getSparePartById(@PathVariable Integer id) {
    return sparePartService.findById(id);
}

@PostMapping("/admin/sparePart/create") // Consulta otras tablas: Sí (refacciones)
public ResponseEntity<Message> createSparePart(
        @Validated(SparePartDto.Create.class) @RequestBody SparePartDto dto) {
    return sparePartService.create(dto);
}

@PutMapping("/admin/sparePart/update") // Consulta otras tablas: Sí (refacciones)
public ResponseEntity<Message> updateSparePart(
        @Validated(SparePartDto.Update.class) @RequestBody SparePartDto dto) {
    return sparePartService.update(dto);
}


```

## brand

```java
// ADMIN
@GetMapping("/admin/brand/all/with-categories") // Consulta otras tablas: Sí (marcas, categorías)
public ResponseEntity<Message> getAllBrandsWithCategories() {
    return brandService.findAllWithCategories();
}

@PostMapping("/admin/brand/create") // Consulta otras tablas: Sí (marcas, categorías)
public ResponseEntity<Message> createBrand(@Validated(BrandDto.Create.class) @RequestBody BrandDto dto) {
    return brandService.create(dto);
}

@PutMapping("/admin/brand/update") // Consulta otras tablas: Sí (marcas, categorías)
public ResponseEntity<Message> updateBrand(@Validated(BrandDto.Update.class) @RequestBody BrandDto dto) {
    return brandService.update(dto);
}

// PUBLIC
@GetMapping("/public/brand/all") // Consulta otras tablas: Sí (marcas)
public ResponseEntity<Message> getAllBrands() {
    return brandService.findAllByStatusActive();
}

```

## category

```java
// ADMIN
@GetMapping("/admin/category/all") // Consulta otras tablas: Sí (categorías)
public ResponseEntity<Message> getAllCategories() {
    return categoryService.findAll();
}

@GetMapping("/admin/category/all/active") // Consulta otras tablas: Sí (categorías)
public ResponseEntity<Message> getAllActiveCategories() {
    return categoryService.findAllActive();
}

@PostMapping("/admin/category/create") // Consulta otras tablas: Sí (categorías)
public ResponseEntity<Message> createCategory(@Validated(CategoryDto.Create.class) @RequestBody CategoryDto dto) {
    return categoryService.create(dto);
}

@PutMapping("/admin/category/update") // Consulta otras tablas: Sí (categorías)
public ResponseEntity<Message> updateCategory(@Validated(CategoryDto.Update.class) @RequestBody CategoryDto dto) {
    return categoryService.update(dto);
}

// PUBLIC
@GetMapping("/public/category/brand/{brandId}") // Consulta otras tablas: Sí (categorías, marcas)
public ResponseEntity<Message> getAllCategoriesByBrandId(@PathVariable Integer brandId) {
    return categoryService.findAllActiveByBrandIdActive(brandId);
}

```

## user

```java
// ADMIN
@GetMapping("/admin/user/all") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> getAllUsers() {
    return userService.find();
}

@GetMapping("/admin/user/{id}") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> getUserById(@PathVariable Integer id) {
    return userService.findById(id);
}

@PostMapping("/admin/user/create") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> createUser(@Validated(UserDto.Create.class) @RequestBody UserDto dto) {
    return userService.create(dto);
}

@PutMapping("/admin/user/update") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> updateUser(@Validated(UserDto.Update.class) @RequestBody UserDto dto) {
    return userService.update(dto);
}

@PostMapping("/admin/user/sendCodeToEmail") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> sendCodeToEmail(@RequestParam String email) {
    return userService.sendCodeToEmail(email);
}

@PostMapping("/admin/user/resetPassword") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> resetPassword(@RequestParam String email, @RequestParam String code,
        @RequestParam String newPassword) {
    return userService.resetPassword(email, code, newPassword);
}

@GetMapping("/admin/user/customers") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> getCustomers() {
    return userService.findCustomers();
}

@GetMapping("/admin/user/staff") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> getStaff() {
    return userService.findStaff();
}

// PUBLIC
@PostMapping("/public/user/create") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> createUser(@Validated(UserDto.Create.class) @RequestBody UserDto dto) {
    return userService.create(dto);
}

@PostMapping("/public/user/sendCodeToEmail") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> sendCodeToEmail(@RequestParam String email) {
    return userService.sendCodeToEmail(email);
}

@PostMapping("/public/user/verifyResetCode") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> verifyResetCode(@RequestParam String email, @RequestParam String code) {
    return userService.verifyResetCode(email, code);
}

@PostMapping("/public/user/resetPassword") // Consulta otras tablas: Sí (usuarios)
public ResponseEntity<Message> resetPassword(@RequestParam String email, @RequestParam String code,
        @RequestParam String newPassword) {
    return userService.resetPassword(email, code, newPassword);
}

```

## order

```java

// ADMIN
@PostMapping("/admin/order/create") // Consulta otras tablas: Sí (usuarios, productos, detalles de orden, historial de orden)
public ResponseEntity<Message> createOrder(@Validated(OrderDto.Create.class) @RequestBody OrderDto dto) {
    return orderService.create(dto);
}

@PutMapping("/admin/order/update") // Consulta otras tablas: Sí (usuarios, productos, detalles de orden)
public ResponseEntity<Message> updateOrder(@Validated(OrderDto.Update.class) @RequestBody OrderDto dto) {
    return orderService.update(dto);
}

@GetMapping("/admin/order/all") // Consulta otras tablas: Sí (órdenes)
public ResponseEntity<Message> getAllOrders() {
    return orderService.findAll();
}

@GetMapping("/admin/order/id") // Consulta otras tablas: Sí (órdenes)
public ResponseEntity<Message> getOrderById(@RequestParam Integer id) {
    return orderService.findById(id);
}

@GetMapping("/admin/order-details/order/{orderId}") // Consulta otras tablas: Sí (detalles de orden)
public ResponseEntity<Message> getOrderDetailsByOrderId(@PathVariable Integer orderId) {
    return orderService.findOrderDetailsByOrderId(orderId);
}

// CUSTOMER
@PostMapping("/customer/order/create") // Consulta otras tablas: Sí (usuarios, productos, detalles de orden)
public ResponseEntity<Message> createOrderCustomer(@Validated(OrderDto.Create.class) @RequestBody OrderDto dto) {
    return orderService.create(dto);
}

@GetMapping("/customer/orders/customer/{customerId}") // Consulta otras tablas: Sí (órdenes)
public ResponseEntity<Message> getCustomerOrdersByCustomerId(@PathVariable Integer customerId) {
    return orderService.findByUserId(customerId);
}

@GetMapping("/customer/order-details/order/{orderId}") // Consulta otras tablas: Sí (detalles de orden)
public ResponseEntity<Message> getOrderDetailsByOrderId(@PathVariable Integer orderId) {
    return orderService.findOrderDetailsByOrderId(orderId);
}

@GetMapping("/customer/order/id") // Consulta otras tablas: Sí (órdenes)
public ResponseEntity<Message> getOrderById(@RequestParam Integer id) {
    return orderService.findById(id);
}

@PutMapping("/customer/order/update") // Consulta otras tablas: Sí (órdenes, detalles de orden, productos)
public ResponseEntity<Message> updateOrderCustomer(@Validated(OrderDto.Update.class) @RequestBody OrderDto dto) {
    return orderService.update(dto);
}

```

## billing

```java

// ADMIN
@GetMapping("/admin/billing/order/{orderId}") // Consulta otras tablas: Sí (facturación, órdenes)
public ResponseEntity<Message> getBillByOrderId(@PathVariable Integer orderId) {
    return billingInfoService.findByOrderId(orderId);
}

@GetMapping("/admin/billing/from-history/{orderId}") // Consulta otras tablas: Sí (historial de orden, facturación)
public ResponseEntity<Message> getBillingInfoFromOrderHistory(@PathVariable Integer orderId) {
    return billingInfoService.getBillingInfoFromOrderHistory(orderId);
}

@PostMapping("/admin/billing/create") // Consulta otras tablas: Sí (facturación)
public ResponseEntity<Message> createBill(@Validated(BillingInfoDto.Create.class) @RequestBody BillingInfoDto dto) {
    return billingInfoService.create(dto);
}

@PutMapping("/admin/billing/update") // Consulta otras tablas: Sí (facturación)
public ResponseEntity<Message> updateBill(@Validated(BillingInfoDto.Update.class) @RequestBody BillingInfoDto dto) {
    return billingInfoService.update(dto);
}

// CUSTOMER
@GetMapping("/customer/billing/id") // Consulta otras tablas: Sí (facturación)
public ResponseEntity<Message> findById(@RequestParam Integer billingId) {
    return billingInfoService.findById(billingId);
}

@GetMapping("/customer/billing/all") // Consulta otras tablas: Sí (facturación)
public ResponseEntity<Message> findAll(@RequestParam Integer userId) {
    return billingInfoService.findAll(userId);
}

@GetMapping("/customer/billing/all/active") // Consulta otras tablas: Sí (facturación)
public ResponseEntity<Message> findActive(@RequestParam Integer userId) {
    return billingInfoService.findActive(userId);
}

@PostMapping("/customer/billing/create") // Consulta otras tablas: Sí (facturación)
public ResponseEntity<Message> createBillingInfo(
        @Validated(BillingInfoDto.Create.class) @RequestBody BillingInfoDto dto) {
    return billingInfoService.create(dto);
}

@PutMapping("/customer/billing/update") // Consulta otras tablas: Sí (facturación)
public ResponseEntity<Message> updateBillingInfo(
        @Validated(BillingInfoDto.Update.class) @RequestBody BillingInfoDto dto) {
    return billingInfoService.update(dto);
}

@GetMapping("/customer/billing/order/{orderId}") // Consulta otras tablas: Sí (facturación, órdenes)
public ResponseEntity<Message> getBillByOrderId(@PathVariable Integer orderId) {
    return billingInfoService.findByOrderId(orderId);
}

@GetMapping("/customer/billing/from-history/{orderId}") // Consulta otras tablas: Sí (historial de orden, facturación)
public ResponseEntity<Message> getBillingInfoFromOrderHistory(@PathVariable Integer orderId) {
    return billingInfoService.getBillingInfoFromOrderHistory(orderId);
}

```

## Landing

```java

// ADMIN
@GetMapping("/admin/landing/all") // Consulta otras tablas: Sí (landings)
public ResponseEntity<Message> getAllLandings() {
    return landingService.findAll();
}

@GetMapping("/admin/landing/{id}") // Consulta otras tablas: Sí (landings)
public ResponseEntity<Message> getLandingById(@PathVariable Integer id) {
    return landingService.findById(id);
}

@PostMapping("/admin/landing/create") // Consulta otras tablas: Sí (landings)
public ResponseEntity<Message> createLanding(@Validated(LandingDto.Create.class) @RequestBody LandingDto dto) {
    return landingService.create(dto);
}

@PutMapping("/admin/landing/update") // Consulta otras tablas: Sí (landings)
public ResponseEntity<Message> updateLanding(@Validated(LandingDto.Update.class) @RequestBody LandingDto dto) {
    return landingService.update(dto);
}

// PUBLIC
@GetMapping("/public/landing/all") // Consulta otras tablas: Sí (landings)
public ResponseEntity<Message> getAllLandingsActive() {
    return landingService.findAllByStatusActive();
}

```

## Multimedia

```java

// ADMIN
@PostMapping("/admin/multimedia/create") // Consulta otras tablas: Sí (multimedia)
public ResponseEntity<Message> createMultimedia(@RequestParam("file") MultipartFile file) {
    return multimediaService.create(file);
}

```

## share/product

```java
    @GetMapping("/{id}")
    public String shareProduct(@PathVariable Integer id, Model model) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getStatus() == Status.ACTIVE)
                .orElse(null);

        if (product == null) {
            model.addAttribute("title", "Producto no encontrado");
            model.addAttribute("description", "Este producto ya no está disponible.");
            model.addAttribute("image", frontendUrl + "/default-product.png");
            model.addAttribute("url", frontendUrl + "/productos");
        } else {
            String title = product.getName();
            Map<String, Object> descMap = product.getDescription();
            String description = descMap != null && descMap.get("destacados") != null
                    ? descMap.get("destacados").toString()
                    : product.getShortDescription();

            String imageUrl = product.getProductMultimedia() != null && !product.getProductMultimedia().isEmpty()
                    ? product.getProductMultimedia().get(0).getMultimedia().getUrl()
                    : frontendUrl + "/default-product.png";

            model.addAttribute("title", title);
            model.addAttribute("description", description);
            model.addAttribute("image", imageUrl);
            model.addAttribute("url", frontendUrl + "/productos/" + product.getId());
        }

        return "product-share"; // HTML en plantilla Thymeleaf
    }
```
