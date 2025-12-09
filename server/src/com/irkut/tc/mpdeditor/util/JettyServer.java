package com.irkut.tc.mpdeditor.util;

import java.io.IOException;
import java.net.URL;
import java.util.EnumSet;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.servlet.DispatcherType;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.bio.SocketConnector;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.FilterHolder;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.resource.Resource;

import com.irkut.tc.mpdeditor.handlers.HandlerStartServer;
import com.irkut.tc.mpdeditor.handlers.MyCorsFilter;
import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentDataset;
import com.teamcenter.rac.kernel.TCComponentManager;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCPreferenceService;
import com.teamcenter.rac.kernel.TCSession;

public class JettyServer implements AutoCloseable {
	// TODO: может добавить endpoint для завершения работы сервера
	
	private static volatile JettyServer INSTANCE;
	
	private final AtomicBoolean started = new AtomicBoolean(false);
	
	private final Server server;
	
	private Thread serverThread;

	private  JettyServer() {
		this.server = new Server();
		SocketConnector connector = new SocketConnector();
        connector.setHost("127.0.0.1");  // Только локальный интерфейс
        connector.setPort(9090);
        connector.setMaxIdleTime(60000);  // Таймаут соединения (опционально)

        server.addConnector(connector);

		
        ServletContextHandler context = new ServletContextHandler();
        context.setContextPath("/");
        
        FilterHolder filterHolder = new FilterHolder(MyCorsFilter.class);
        context.addFilter(filterHolder, "/*", EnumSet.of(DispatcherType.REQUEST)); // TODO: может тут сделать только с локал хоста
        
        URL publicURL = HandlerStartServer.class.getResource("/public");
        if (publicURL != null) {
        	try {
				context.setBaseResource(Resource.newResource(publicURL));
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
        }
//		        context.setBaseResource(Resource.newClassPathResource("/public"));
        
        // Добавляем endpoint /getitem
        context.addServlet(new ServletHolder(createGetItemServlet()), "/getitem");
 
        ServletHolder holderGetDataset = new ServletHolder("/getdataset", new HandlerDataset());
        context.addServlet(holderGetDataset, "/getdataset"); // getdataset?uid=(uid)
        
        ServletHolder holderUpdateDataset = new ServletHolder("/updatedataset", new UpdateDataset());
        context.addServlet(holderUpdateDataset, "/updatedataset"); // getdataset?uid=(uid)
        
        ServletHolder defauldHolder = new ServletHolder("static", DefaultServlet.class);
        defauldHolder.setInitParameter("dirAllowed", "true");
        defauldHolder.setInitParameter("pathInfoOnly", "true");
        context.addServlet(defauldHolder, "/static/*");
        
     

		
//		        server.setHandler(resource_handler);
        server.setHandler(context);
        
	}
	
	public static JettyServer getInstance() {
	    if (INSTANCE == null) {
	      INSTANCE = new JettyServer();
	    }
	    return INSTANCE;
	  }
	
	public void start() { // TODO: подумать как его лучше убивать
		 if (!started.compareAndSet(false, true)) {
			 System.out.println("Сервер уже запущен");
	     }

	        serverThread = new Thread(() -> {
	            try {
	                server.start();
	                server.join();
	            } catch (Exception e) {
	                started.set(false);
	                throw new RuntimeException("Ошибка при запуске сервера", e);
	            }
	        });

	        serverThread.setName("Jetty-Server-MPD-Thread");
	        serverThread.start();
	}
	
	public void stop() throws Exception {
        if (!started.compareAndSet(true, false)) {
            return;
        }

        try {
            server.stop();
            if (serverThread != null && serverThread.isAlive()) {
                serverThread.join(5000);
            }
        } finally {
            serverThread = null;
        }
    }
	
	private HttpServlet createGetItemServlet() {
        return new HttpServlet() {
            @Override
            protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
                try {
                    String uid = req.getParameter("uid");
                    if (uid == null || uid.trim().isEmpty()) {
                        sendErrorResponse(resp, 400, "UID parameter is required");
                        return;
                    }

                    TCSession session = (TCSession) AIFUtility.getDefaultSession();
                    TCPreferenceService prefService = session.getPreferenceService();
                    TCComponentManager cm = session.getComponentManager();

                    TCComponent comp;
                    try {
                        comp = cm.getTCComponent(uid);
                    } catch (TCException e) {
                        sendErrorResponse(resp, 500, "Failed to get component: " + e.getMessage());
                        return;
                    }

                    if (!(comp instanceof TCComponentDataset)) {
                        sendErrorResponse(resp, 404, "Dataset not found");
                        return;
                    }

                    // Успешный ответ
                    resp.setStatus(200);
                    resp.setContentType("application/json");
                    resp.getWriter().write("{\"status\": \"ok\"}");

                } catch (Exception e) {
                    sendErrorResponse(resp, 500, "Internal server error: " + e.getMessage());
                }
            }

            private void sendErrorResponse(HttpServletResponse resp, int status, String message) throws IOException {
                resp.setStatus(status);
                resp.setContentType("application/json");
                resp.getWriter().write(String.format("{\"error\": \"%s\"}", message));
            }
        };
    }
	
	public boolean isRunning() {
        return started.get() && server.isRunning();
    }
	
	@Override
    public void close() throws Exception {
        stop();
    }
	
}
