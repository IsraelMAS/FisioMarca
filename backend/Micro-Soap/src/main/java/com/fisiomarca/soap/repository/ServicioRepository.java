package com.fisiomarca.soap.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.fisiomarca.soap.Servicio;

/**
 * Acceso a datos con JdbcTemplate sobre la tabla "servicios" (BD fisiomarca_catalogo).
 */
@Repository
public class ServicioRepository {

    private final JdbcTemplate template;

    public ServicioRepository(JdbcTemplate template) {
        this.template = template;
    }

    private Servicio mapRow(ResultSet rs, int rowNum) throws SQLException {
        Servicio s = new Servicio();
        s.setId(rs.getInt("id"));
        s.setNombre(rs.getString("nombre"));
        s.setDescripcion(rs.getString("descripcion"));
        s.setPrecio(rs.getDouble("precio"));
        s.setDuracionMinutos(rs.getInt("duracion_minutos"));
        s.setImagenUrl(rs.getString("imagen_url"));
        s.setActivo(rs.getBoolean("activo"));
        s.setCategoriaId(rs.getInt("categoria_id"));
        return s;
    }

    public List<Servicio> listServicios() {
        String sql = "select id, nombre, descripcion, precio, duracion_minutos, imagen_url, activo, categoria_id "
                + "from servicios order by id";
        return template.query(sql, this::mapRow);
    }

    public Servicio findServicio(int id) {
        String sql = "select id, nombre, descripcion, precio, duracion_minutos, imagen_url, activo, categoria_id "
                + "from servicios where id = ?";
        List<Servicio> resultado = template.query(sql, this::mapRow, id);
        return resultado.isEmpty() ? null : resultado.get(0);
    }

    public int saveServicio(Servicio bean) {
        String sql = "insert into servicios (nombre, descripcion, precio, duracion_minutos, imagen_url, activo, categoria_id) "
                + "values (?, ?, ?, ?, ?, ?, ?)";
        return template.update(sql,
                bean.getNombre(),
                bean.getDescripcion(),
                bean.getPrecio(),
                bean.getDuracionMinutos(),
                bean.getImagenUrl(),
                bean.isActivo(),
                bean.getCategoriaId());
    }
}
