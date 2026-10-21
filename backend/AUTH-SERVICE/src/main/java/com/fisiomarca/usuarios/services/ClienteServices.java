package com.fisiomarca.usuarios.services;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import com.fisiomarca.usuarios.entity.Cliente;
import com.fisiomarca.usuarios.repository.ClienteRepository;

@Service
public class ClienteServices extends ICRUDImpl<Cliente, Integer> {
	private final ClienteRepository repo;

	public ClienteServices(ClienteRepository repo) {
		this.repo = repo;
	}

	@Override
	public JpaRepository<Cliente, Integer> repo() {
		return repo;
	}

	public boolean existe(Integer id) {
		return repo.existsById(id);
	}
}
