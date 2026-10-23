package toko_online.repository;

import toko_online.model.entity.Transaction;

import java.util.List;
import java.util.Optional;

import org.springframework.transaction.TransactionStatus;

public interface TransactionRepository {
    Transaction save(Transaction transaction);

    Optional<Transaction> findById(String idTransaction);

    List<Transaction> findAll();

    List<Transaction> findByUserEmail(String email);

    boolean deleteById(String idTransaction);

    boolean updateStatus(String idTransaction, toko_online.model.enums.TransactionStatus targetStatus);
}
