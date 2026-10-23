package toko_online.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import toko_online.exception.UnauthorizedException;
import toko_online.model.dto.request.TransactionRequest;
import toko_online.model.dto.response.ApiResponse;
import toko_online.model.dto.response.TransactionDetailResponse;
import toko_online.model.dto.response.TransactionResponse;
import toko_online.security.AppUserPrincipal;
import toko_online.security.CurrentUser;
import toko_online.service.TransactionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transactions", description = "CRUD transaksi: Kasir hanya melihat akun sendiri, Owner memonitor semua kasir.")
public class TransactionController {

    private static final Logger log = LoggerFactory.getLogger(TransactionController.class);
    private final TransactionService transactionService;

    // Constructor Injection: Spring otomatis meng-inject bean TransactionService
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    @Operation(summary = "Buat transaksi pembelian / POS kasir")
    public ResponseEntity<ApiResponse<TransactionResponse>> buyProduct(@Valid @RequestBody TransactionRequest request) {
        AppUserPrincipal principal = CurrentUser.require();
        // Pastikan email transaksi diisi dengan akun kasir yang sedang login jika kasir tidak mengisinya
        if (request.getUserEmail() == null || request.getUserEmail().trim().isEmpty()) {
            request.setUserEmail(principal.getEmail());
        }

        log.info("REST Request: POST /api/v1/transactions oleh {} untuk produk ID: {}", principal.getEmail(), request.getProductId());
        TransactionResponse response = transactionService.createTransaction(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Transaksi berhasil diproses", response));
    }

    @GetMapping
    @Operation(summary = "List riwayat transaksi: Kasir melihat transaksi miliknya, Owner memantau semua kasir")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTransactions(
            @RequestParam(required = false) String email) {
        AppUserPrincipal principal = CurrentUser.require();
        boolean isOwnerOrAdmin = "OWNER".equalsIgnoreCase(principal.getRole()) || "ADMIN".equalsIgnoreCase(principal.getRole());

        String filterEmail;
        if (isOwnerOrAdmin) {
            // Owner bisa melihat semua kasir atau memfilter kasir tertentu via param email
            filterEmail = (email != null && !email.trim().isEmpty()) ? email.trim() : null;
            log.info("REST Request: GET /api/v1/transactions oleh Owner/Admin (filter email: '{}')", filterEmail != null ? filterEmail : "SEMUA");
        } else {
            // Kasir HANYA bisa melihat transaksi yang dilakukan di akun dia
            filterEmail = principal.getEmail();
            log.info("REST Request: GET /api/v1/transactions oleh Kasir {}", filterEmail);
        }

        List<TransactionResponse> list = transactionService.getTransactionsByUserEmail(filterEmail);
        return ResponseEntity.ok(ApiResponse.ok("Berhasil mengambil data transaksi", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detail transaksi by ID")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionById(@PathVariable String id) {
        AppUserPrincipal principal = CurrentUser.require();
        boolean isOwnerOrAdmin = "OWNER".equalsIgnoreCase(principal.getRole()) || "ADMIN".equalsIgnoreCase(principal.getRole());

        TransactionResponse res = transactionService.getTransactionById(id);
        if (!isOwnerOrAdmin && !principal.getEmail().equalsIgnoreCase(res.getUserEmail())) {
            throw new UnauthorizedException("Anda tidak memiliki izin untuk melihat transaksi kasir lain.");
        }

        return ResponseEntity.ok(ApiResponse.ok("Berhasil mengambil data transaksi", res));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update status transaksi (PAID, CANCELLED, PENDING)")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        AppUserPrincipal principal = CurrentUser.require();
        boolean isOwnerOrAdmin = "OWNER".equalsIgnoreCase(principal.getRole()) || "ADMIN".equalsIgnoreCase(principal.getRole());

        TransactionResponse existing = transactionService.getTransactionById(id);
        if (!isOwnerOrAdmin && !principal.getEmail().equalsIgnoreCase(existing.getUserEmail())) {
            throw new UnauthorizedException("Anda tidak memiliki izin untuk mengubah transaksi kasir lain.");
        }

        String status = body.getOrDefault("status", "PAID");
        TransactionResponse updated = transactionService.updateTransactionStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Status transaksi berhasil diupdate", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Hapus / Batalkan transaksi (Owner & Kasir pemilik transaksi)")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable String id) {
        AppUserPrincipal principal = CurrentUser.require();
        boolean isOwnerOrAdmin = "OWNER".equalsIgnoreCase(principal.getRole()) || "ADMIN".equalsIgnoreCase(principal.getRole());

        TransactionResponse existing = transactionService.getTransactionById(id);
        if (!isOwnerOrAdmin && !principal.getEmail().equalsIgnoreCase(existing.getUserEmail())) {
            throw new UnauthorizedException("Anda tidak memiliki izin untuk menghapus transaksi kasir lain.");
        }

        transactionService.deleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.ok("Transaksi berhasil dihapus dan stok dikembalikan.", null));
    }

    @GetMapping("/details")
    @Operation(summary = "List detail transaksi (Monitoring)")
    public ResponseEntity<ApiResponse<List<TransactionDetailResponse>>> getTransactionDetails(
            @RequestParam(required = false) String email) {
        AppUserPrincipal principal = CurrentUser.require();
        boolean isOwnerOrAdmin = "OWNER".equalsIgnoreCase(principal.getRole()) || "ADMIN".equalsIgnoreCase(principal.getRole());

        String filterEmail = isOwnerOrAdmin ? email : principal.getEmail();
        log.info("REST Request: GET /api/v1/transactions/details (filter: '{}')", filterEmail);
        List<TransactionDetailResponse> list = transactionService.getTransactionDetails(filterEmail);
        return ResponseEntity.ok(ApiResponse.ok("Berhasil mengambil detail transaksi", list));
    }
}
