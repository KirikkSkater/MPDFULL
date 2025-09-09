package com.irkut.tc.mpdeditor.handlers;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;


public class MyCorsFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) { }
 
    @Override
    public void doFilter(ServletRequest req, ServletResponse res,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;
 
        // Разрешаем все источники (для отладки можно ограничить)
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
        response.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
        response.setHeader("Access-Control-Allow-Credentials", "true");
 
        // Preflight запросы (OPTIONS) можно завершить сразу
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }
 
        // Для остальных запросов продолжаем цепочку
        chain.doFilter(req, res);
    }
 
    @Override
    public void destroy() { }
}

