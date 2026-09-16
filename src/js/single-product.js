import {API_URL} from './config';

$(document).ready(function () {
    var params = new URLSearchParams(window.location.search);
    var productName = params.get('name');

    var currentProduct = null;
    var currentVariant = null;

    if (!productName) {
        console.warn('No product name in URL, cannot load product.');
        return;
    }

    getProduct(productName);

    $('#product-add-to-cart').on('click', function (e) {
        e.preventDefault();

        if (!currentProduct || !currentVariant) {
            console.warn('No product/variant selected yet.');
            return;
        }

        if (currentVariant.quantity <= 0) {
            alert('This variant is out of stock.');
            return;
        }

        var quantity = parseInt($('#quantity').val()) || 0;

        if (quantity > currentVariant.quantity) {
            alert(`Only ${currentVariant.quantity} in stock.`);
            return;
        }

        var imgList = currentVariant.images && currentVariant.images.size
            ? Array.from(currentVariant.images)
            : (currentVariant.images || []);
        var image = imgList.length ? imgList[0] : null;

        addToCart({
            sku: currentVariant.sku,
            name: currentProduct.name,
            color: currentVariant.color,
            size: currentVariant.size,
            price: currentVariant.price,
            image: image,
            quantity: quantity,
            maxQuantity: currentVariant.quantity
        });
    });


    // --- Click handlers: switching color or size picks the matching variant ---
    $(document).on('click', '#product-colors .select-item a', function (e) {
        e.preventDefault();
        if ($(this).hasClass('disabled')) return;
        var color = $(this).closest('.select-item').data('val');
        switchVariant({color: color, size: currentVariant.size});
    });

    $(document).on('click', '#product-sizes .select-item a', function (e) {
        e.preventDefault();
        if ($(this).hasClass('disabled')) return;
        var size = $(this).closest('.select-item').data('value');
        switchVariant({color: currentVariant.color, size: size});
    });

    $(document).on('click', '#product-thumbnail-images .swiper-slide', function () {
        var index = $(this).index();
        if (window.productLargeSwiper) {
            window.productLargeSwiper.slideTo(index);
        }
    });

    // --- Quantity plus/minus: always re-check live value against currentVariant.quantity ---
    $(document).on('click', '.quantity-right-plus', function () {
        if (!currentVariant) return;

        var $input = $('#quantity');
        var current = parseInt($input.val(), 10);
        if (isNaN(current)) current = 0;

        var max = currentVariant.quantity || 0;

        if (current < max) {
            $input.val(current + 1);
        }
        // if current >= max, do nothing — simply don't increase
    });

    $(document).on('click', '.quantity-left-minus', function () {
        var $input = $('#quantity');
        var current = parseInt($input.val(), 10);
        if (isNaN(current)) current = 0;

        if (current > 1) {
            $input.val(current - 1);
        }
        // floor is 1 — quantity can't go below 1 while stock is available
    });

    function switchVariant(target) {
        var match = currentProduct.variants.find(function (v) {
            return v.color === target.color && v.size === target.size;
        });

        // Fall back: if that exact color+size combo doesn't exist, keep the color
        // and pick any variant with that color (or vice versa)
        if (!match) {
            match = currentProduct.variants.find(function (v) {
                    return v.color === target.color;
                })
                || currentProduct.variants.find(function (v) {
                    return v.size === target.size;
                });
        }

        if (match) {
            selectVariant(match);
        } else {
            console.warn('No matching variant for', target);
        }
    }

    function getProduct(name) {
        $.ajax({
            method: 'GET',
            url: `${API_URL}/product/${encodeURIComponent(name)}`,
        })
            .done(function (result) {
                if (!result.data) {
                    console.warn('Product not found for name:', name);
                    $('#product-name').text('Product not found');
                    return;
                }
                currentProduct = result.data;
                renderProduct(currentProduct);
            })
            .fail(function (err) {
                console.error('Failed to load product', err);
                $('#product-name').text('Product not found');
            });
    }

    function selectVariant(variant) {
        currentVariant = variant;

        $('#product-sku').text(variant.sku);
        $('#product-price').text('$' + Number(variant.price).toFixed(2));
        $('#product-stock').text(
            variant.quantity != null ? `${variant.quantity} in stock` : 'Out of stock'
        );

        // Reset quantity input, capped to available stock (at least 1 if in stock)
        $('#quantity').val(variant.quantity > 0 ? 1 : 0);

        renderImages(variant.images, currentProduct.name);
        renderCategories(variant.categories);
        renderTags(variant.tags);

        // Reflect active state on already-rendered color/size lists
        $('#product-colors .select-item a').removeClass('active')
            .filter(function () {
                return $(this).text().trim() === variant.color;
            })
            .addClass('active');

        $('#product-sizes .select-item a').removeClass('active')
            .filter(function () {
                return $(this).text().trim() === variant.size;
            })
            .addClass('active');
    }

    function renderColorOptions(variants, activeVariant) {
        var seen = new Set();
        var colorsHtml = variants
            .filter(function (v) {
                if (seen.has(v.color)) return false;
                seen.add(v.color);
                return true;
            })
            .map(function (v) {
                var isActive = v.color === activeVariant.color;
                var hasStock = variants.some(function (vv) {
                    return vv.color === v.color && vv.quantity > 0;
                });
                return `<li class="select-item pe-3" data-val="${v.color}" title="${v.color}">
                      <a href="#" class="btn btn-light fs-6 ${isActive ? 'active' : ''} ${!hasStock ? 'disabled' : ''}">${v.color}</a>
                    </li>`;
            }).join('');
        $('#product-colors').html(colorsHtml);
    }

    function renderSizeOptions(variants, activeVariant) {
        var seen = new Set();
        var sizesHtml = variants
            .filter(function (v) {
                if (seen.has(v.size)) return false;
                seen.add(v.size);
                return true;
            })
            .map(function (v) {
                var isActive = v.size === activeVariant.size;
                var hasStock = variants.some(function (vv) {
                    return vv.size === v.size && vv.quantity > 0;
                });
                return `<li data-value="${v.size}" class="select-item pe-3">
                      <a href="#" class="btn btn-light fs-6 ${isActive ? 'active' : ''} ${!hasStock ? 'disabled' : ''}">${v.size}</a>
                    </li>`;
            }).join('');
        $('#product-sizes').html(sizesHtml);
    }

    function renderCategories(categories) {
        var catList = categories && categories.size ? Array.from(categories) : (categories || []);
        var html = catList.map(function (cat, i) {
            var comma = i < catList.length - 1 ? ',&nbsp' : '';
            return `<li class="select-item"><a href="/shop.html?category=${encodeURIComponent(cat)}">${cat}</a>${comma}</li>`;
        }).join('');
        $('#product-categories').html(html);
    }

    function renderTags(tags) {
        var tagList = tags && tags.size ? Array.from(tags) : (tags || []);
        var html = tagList.map(function (tag, i) {
            var comma = i < tagList.length - 1 ? ',&nbsp' : '';
            return `<li class="select-item">
                    <a href="/shop.html?tag=${encodeURIComponent(tag)}">${tag}${comma}
                    </a>
                    </li>`;
        }).join('');
        $('#product-tags').html(html);
    }

    function renderImages(images, productName) {
        var imgList = images && images.size ? Array.from(images) : (images && images.length ? images : []);

        var largeSlidesHtml = imgList.map(function (img) {
            return `<div class="swiper-slide"><img src="${API_URL}/file/product/${img}" alt="${productName}" class="img-fluid"></div>`;
        }).join('');
        $('#product-large-images').html(largeSlidesHtml);

        var thumbSlidesHtml = imgList.map(function (img) {
            return `<div class="swiper-slide"><img src="${API_URL}/file/product/${img}" alt="${productName}" class="thumb-image img-fluid"></div>`;
        }).join('');
        $('#product-thumbnail-images').html(thumbSlidesHtml);

        // Rebuild Swiper's internal slide tracking after replacing the DOM
        if (window.productLargeSwiper) {
            window.productLargeSwiper.update();
            window.productLargeSwiper.slideTo(0, 0); // 0ms transition, snap instantly
        }
        if (window.productThumbSwiper) {
            window.productThumbSwiper.update();
            window.productThumbSwiper.slideTo(0, 0);
        }
    }

    function renderProduct(item) {
        currentProduct = item;

        var initialVariant = item.variants && item.variants.length ? item.variants[0] : null;
        if (!initialVariant) {
            console.warn('Product has no variants:', item);
            return;
        }

        $('#product-name').text(item.name);
        $('#product-description').text(item.description || '');
        $('#v-pills-description').text(item.description || '');
        $('#v-pills-additional').text(item.information || '');

        renderColorOptions(item.variants, initialVariant);
        renderSizeOptions(item.variants, initialVariant);
        selectVariant(initialVariant);
    }
});