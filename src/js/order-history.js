import { API_URL } from './config';


$(document).ready(function () {

    // === KIỂM TRA ĐĂNG NHẬP ===
    var token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để xem lịch sử đơn hàng!');
        window.location.href = 'account.html?redirect=order-history.html';
        return;
    }

    // Gọi load trang đầu tiên
    loadOrderHistory(0);


    // === HÀM GỌI API VÀ RENDER BẢNG ĐƠN HÀNG ===
    function loadOrderHistory(page) {
        var pageSize = 5;

        // Hiển thị loading, ẩn các phần khác
        $('#order-history-loading').show();
        $('#order-history-container').hide();
        $('#order-history-empty').hide();
        $('#order-history-error').addClass('d-none');
        $('#order-history-pagination').hide();

        $.ajax({
            url: API_URL + '/api/order/history?page=' + page + '&size=' + pageSize,
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .done(function (result) {
            // Ẩn loading
            $('#order-history-loading').hide();

            var pageData = result.data;

            // Nếu không có đơn hàng nào
            if (!pageData || !pageData.content || pageData.content.length === 0) {
                $('#order-history-empty').show();
                return;
            }

            // Render từng đơn hàng vào bảng
            var tbody = $('#order-history-body');
            tbody.empty();

            for (var i = 0; i < pageData.content.length; i++) {
                var order = pageData.content[i];
                var row = buildOrderRow(order);
                tbody.append(row);
            }

            // Hiển thị bảng
            $('#order-history-container').show();

            // Render phân trang
            renderPagination(pageData.page, pageData.totalPages);
        })
        .fail(function (xhr) {
            $('#order-history-loading').hide();

            // Nếu token hết hạn (401) → về trang đăng nhập
            if (xhr.status === 401) {
                localStorage.removeItem('token');
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = 'account.html?redirect=order-history.html';
                return;
            }

            // Hiển thị lỗi khác
            var res = xhr.responseJSON;
            var errorMsg = (res && res.message) ? res.message : 'Không thể tải lịch sử đơn hàng.';
            $('#order-history-error').removeClass('d-none').text(errorMsg);
        });
    }


    // === HÀM TẠO 1 DÒNG TRONG BẢNG CHO 1 ĐƠN HÀNG ===
    function buildOrderRow(order) {
        // 1. Render danh sách sản phẩm
        var productsHtml = '';
        for (var i = 0; i < order.items.length; i++) {
            var item = order.items[i];

            // Xử lý ảnh sản phẩm
            var imgSrc = '/src/assets/images/product-item-1.jpg'; // ảnh mặc định
            if (item.image) {
                imgSrc = API_URL + '/file/product/' + item.image;
            }

            productsHtml += ''
                + '<div class="d-flex align-items-center mb-2 pb-2 border-bottom border-light">'
                + '    <img src="' + imgSrc + '" '
                + '         alt="' + escapeHtml(item.productName) + '" '
                + '         class="rounded me-3 border" '
                + '         style="width: 48px; height: 48px; object-fit: cover;" '
                + '         onerror="this.src=\'/src/assets/images/product-item-1.jpg\'">'
                + '    <div>'
                + '        <div class="fw-semibold text-dark">' + escapeHtml(item.productName) + '</div>'
                + '        <small class="text-muted">'
                + '            ' + escapeHtml(item.color || 'Standard') + ' / ' + escapeHtml(item.size || 'Free')
                + '            &nbsp;|&nbsp; Qty: ' + item.quantity
                + '            &nbsp;|&nbsp; $' + parseFloat(item.price).toFixed(2)
                + '        </small>'
                + '    </div>'
                + '</div>';
        }

        // 2. Render badge trạng thái
        var statusBadge = getStatusBadge(order.status);

        // 3. Ghép thành 1 dòng <tr>
        var row = ''
            + '<tr>'
            + '    <td><span class="badge bg-light text-dark border fs-6">#' + order.orderId + '</span></td>'
            + '    <td><div class="small fw-semibold">' + formatDate(order.createDate) + '</div></td>'
            + '    <td><div class="py-1">' + productsHtml + '</div></td>'
            + '    <td><span class="text-capitalize fw-medium">' + escapeHtml(order.paymentMethod || 'N/A') + '</span></td>'
            + '    <td><span class="fw-bold text-dark fs-6">$' + parseFloat(order.total).toFixed(2) + '</span></td>'
            + '    <td class="text-center">' + statusBadge + '</td>'
            + '</tr>';

        return row;
    }


    // === HÀM TẠO BADGE MÀU THEO TRẠNG THÁI ===
    function getStatusBadge(status) {
        var badgeClass = 'bg-secondary';

        if (status === 'PAID') {
            badgeClass = 'bg-success';
        } else if (status === 'PENDING') {
            badgeClass = 'bg-warning text-dark';
        } else if (status === 'CANCELED') {
            badgeClass = 'bg-danger';
        } else if (status === 'PUBLISHED') {
            badgeClass = 'bg-info text-dark';
        }

        return '<span class="badge ' + badgeClass + ' rounded-pill px-3 py-2 text-uppercase" style="color: black">'
             + (status || 'UNKNOWN')
             + '</span>';
    }


    // === HÀM FORMAT NGÀY GIỜ ===
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';

        var d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }


    // === HÀM CHỐNG XSS ===
    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }


    // === HÀM RENDER PHÂN TRANG ===
    function renderPagination(currentPage, totalPages) {
        var paginationList = $('#order-pagination-list');
        paginationList.empty();

        // Nếu chỉ có 1 trang thì không cần hiển thị phân trang
        if (totalPages <= 1) {
            $('#order-history-pagination').hide();
            return;
        }

        // Nút Previous
        var prevDisabled = (currentPage === 0) ? 'disabled' : '';
        paginationList.append(
            '<li class="page-item ' + prevDisabled + '">'
            + '<a class="page-link" href="#" data-page="' + (currentPage - 1) + '">«</a>'
            + '</li>'
        );

        // Các số trang
        for (var i = 0; i < totalPages; i++) {
            var activeClass = (i === currentPage) ? 'active' : '';
            paginationList.append(
                '<li class="page-item ' + activeClass + '">'
                + '<a class="page-link" href="#" data-page="' + i + '">' + (i + 1) + '</a>'
                + '</li>'
            );
        }

        // Nút Next
        var nextDisabled = (currentPage === totalPages - 1) ? 'disabled' : '';
        paginationList.append(
            '<li class="page-item ' + nextDisabled + '">'
            + '<a class="page-link" href="#" data-page="' + (currentPage + 1) + '">»</a>'
            + '</li>'
        );

        $('#order-history-pagination').show();

        // Xử lý click chuyển trang
        paginationList.find('a.page-link').off('click').on('click', function (e) {
            e.preventDefault();
            var page = parseInt($(this).data('page'));
            if (page >= 0 && page < totalPages) {
                loadOrderHistory(page);
                // Cuộn lên đầu bảng
                $('html, body').animate({ scrollTop: $('#order-history-container').offset().top - 100 }, 300);
            }
        });
    }

});