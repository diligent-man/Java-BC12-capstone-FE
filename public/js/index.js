$(document).ready(function () {
  alert("Hello, welcome to Uniclub!"); // Display a welcome alert when the document is ready

  var linkBE = "http://localhost:8080"
  var pageNumber = 0
  var cart = []
  //mỗi khi reload file sẽ đọc lại tài liệu(document) từ đầu khiến mảng cart [] sẽ set lại về null khiến giỏ hàng sẽ bị rỗng, 
  // vì vậy phải gọi lại mảng cart đã lưu trong localStorage
  //mảng này là mảng string JSON
  var cartString = localStorage.getItem('cart')
  if(cartString !=null){ //ktra mang phải khác null, nếu null thì vẫn giữ nguyên
    //đưa vào mảng cart những phần tử đã lưu trong localStorage
    cart = JSON.parse(cartString) // String JSON → object JavaScript
  }

    if (!isLastPage) {
        getProduct(page);
        $('#view-more-product').click(function () {
            page++;
            getProduct(page);
        });
    }


    // $('.btn-cart').click(function () {
    //   alert("Bạn đã thêm sản phẩm vào giỏ hàng thành công!");
    // });
    // ghi như này sẽ không click được
    // giải thích cụ thể: ban đầu khi document này lần đầu được chuẩn bị(ready), thì chưa có btn-cart nào cả (có thể xem bên index.html)
    // ở chỗ  <div id ="container-product" class="row">
    //           </div>
    // chỉ khi chạy function getProduct(pageNumber) thì btn-cart mới được thêm vào thông qua vòng lặp for,
    // vì vậy bây giờ phải cho nó quét lại chỗ <div id ="container-product" class="row">
    //                                           </div>
    // phải viết như này để nó quét lại thì mới click được
    $('#container-product').on('click', '.btn-cart', function () { //thuc hien quet lai container - product
        // HTML attribute trả về string
        var strJsonItem = $(this).attr("data");
        // String JSON → object JavaScript
        var item = JSON.parse(strJsonItem);
        var isExist = false

        //kiểm tra xem trong giỏ hàng đã tồn tại sản phẩm chưa thông qua biến cờ isExist
        // nếu tồn tại rồi thì quantity + 1, không thêm mới item
        // nếu chưa tồn tại thì quantity = 1, thêm mới item
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id === item.id) {
                cart[i].quantity += 1
                isExist = true
            }
        }
        if (isExist === false) {
            item.quantity = 1
            // Thêm object vào mảng JavaScript
            cart.push(item);

        }
        // Mảng JavaScript → string JSON
        var cartString = JSON.stringify(cart);

        // localStorage chỉ lưu được dạng string thôi
        // có nhiều cách lưu có thể lưu trong cookie nhưng ở đây chọn lưu trong localStorage
        localStorage.setItem("cart", cartString);
    })

    function getProduct(page) {
        $.ajax({
            method: "GET",
            url: `${linkBE}/product/paging?page=${page}&size=5`,
        })
            .done(
                function (result) {
                    // console.log("kiemtra ", result.data);
                    var data = result.data.content;
                    var isLastPage = result.data.lastPage;

                    if (isLastPage) {
                        $('#view-more-product').prop('disabled', true).hide();
                        return;
                    }

                    var html = ''
                    for (let i = 0; i < data.length; i++) {
                        var item = data[i];
                        var stringJSON = JSON.stringify(item);
                        html += `<div class="col-md-6 col-lg-3 my-4">
                            <div class="product-item">
                              <div class="image-holder" style="width: 100%; height: 100%;">
                                    <img src="${linkBE}/file/${item.image}" alt="Books" class="product-image img-fluid">
                              </div>
                              <div class="cart-concern">
                                <div class="cart-button d-flex justify-content-between align-items-center">
                                  <span href="#" data='${stringJSON}' class=" btn-cart btn-wrap cart-link d-flex align-items-center text-capitalize fs-6 ">add to cart <i
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
                }
            )
    }
})