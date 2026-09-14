import {API_URL} from './config';

$(document).ready(function () {
    var page = 0
    var cart = []
    var isLastPage = false
    var cartString = localStorage.getItem('cart')

    if (cartString != null) {
        cart = JSON.parse(cartString)
    }
    updateCartBadge();
    updateOffcanvasCart();

    if (!isLastPage) {
        getProduct(page);
        $('#view-more-product').click(function () {
            page++;
            getProduct(page);
        });
    }


    $('#container-product').on('click', '.btn-cart', function () {
        var strJsonItem = $(this).attr("data");
        var item = JSON.parse(strJsonItem);

        var isExist = false
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].name === item.name) {
                cart[i].quantity += 1
                isExist = true
            }
        }
        if (isExist === false) {
            item.quantity = 1
            cart.push(item);

        }

        var cartString = JSON.stringify(cart);
        localStorage.setItem("cart", cartString);

        updateCartBadge();
        updateOffcanvasCart();

        alert("Đã thêm sản phẩm vào giỏ hàng thành công!");
    })

    function getProduct(page) {
        $.ajax({
            method: "GET",
            url: `${API_URL}/product/paging?page=${page}&size=5`,
        })
            .done(
                function (result) {
                    var data = result.data.content;
                    var isLastPage = result.data.lastPage;

                    var html = ''
                    for (let i = 0; i < data.length; i++) {
                        var item = data[i];
                        var stringJSON = JSON.stringify(item);

                        html += `<div class="col-md-6 col-lg-3 my-4">
                            <div class="product-item">
                              <div class="image-holder" style="width: 100%; height: 100%;">
                                    <img src="${API_URL}/file/product/${item.image}" alt="Books" class="product-image img-fluid">
                              </div>
                              
                              <div class="cart-concern">
                                <div class="cart-button d-flex justify-content-between align-items-center">
                                  <span href="#" data-item='${stringJSON}' class=" btn-cart btn-wrap cart-link d-flex align-items-center text-capitalize fs-6 ">add to cart <i
                                      class="icon icon-arrow-io pe-1"></i>
                                  </span>
                                  <a href="single-product.html" class="view-btn">
                                    <i class="icon icon-screen-full"></i>
                                  </a>
                                  <a href="#" class="wishlist-btn">
                                    <i class="icon icon-heart"></i>
                                  </a>
                                </div>
                              </div>
                              
                              <div class="product-detail d-flex justify-content-between align-items-center mt-4">
                                <h4 class="product-title mb-0">
                                  <a href="single-product.html">${item.name}</a>
                                </h4>
                                <p class="m-0 fs-5 fw-normal">${item.price}</p>
                              </div>
                            </div>
                          </div>`
                    }
                    $('#container-product').append(html);

                    if (isLastPage) {
                        $('#view-more-product').prop('disabled', true).hide();
                    }
                }
            )
    }
});
