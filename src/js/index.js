import {API_URL} from './config';

$(document).ready(function () {
    var page = 0
    var isLastPage = false

    if (!isLastPage) {
        getProduct(page);
        $('#view-more-product').click(function () {
            page++;
            getProduct(page);
        });
    }

    function getProduct(page) {
        $.ajax({
            method: "GET",
            url: `${API_URL}/product/paging?page=${page}&size=8`,
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
                              <div class="image-holder" style="width: 100%; height: 100%; aspect-ratio: 1 / 1; overflow: hidden;">
                                    <img src="${API_URL}/file/product/${item.image}"
                                         alt="Books"
                                         class="product-image img-fluid"
                                         style="width:100%; height:100%; object-fit: cover;"
                                         >
                              </div>
                              
                              <div class="cart-concern">
                                <div class="cart-button d-flex justify-content-between align-items-center">
                                  <span href="#" onclick="goToSingleProduct(this)" data-item='${stringJSON}' class="btn-cart btn-wrap cart-link d-flex align-items-center text-capitalize fs-6 ">see detail
                                    <i class="icon icon-arrow-io pe-1"></i>
                                  </span>
                                  
                                  <a href="single-product.html?name=${encodeURIComponent(item.name)}" class="view-btn">
                                    <i class="icon icon-screen-full"></i>
                                  </a>
                                  
                                  <a href="#" class="wishlist-btn">
                                    <i class="icon icon-heart"></i>
                                  </a>
                                </div>
                              </div>
                              
                              <div class="product-detail d-flex justify-content-between align-items-center mt-4">
                                <h4 class="product-title mb-0">
                                  <a href="single-product.html?name=${encodeURIComponent(item.name)}">${item.name}</a>
                                </h4>
                                <p class="m-0 fs-5 fw-normal">$${item.price.toFixed(2)}</p>
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
