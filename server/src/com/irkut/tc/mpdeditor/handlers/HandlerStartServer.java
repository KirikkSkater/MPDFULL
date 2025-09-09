package com.irkut.tc.mpdeditor.handlers;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerCollection;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.FilterHolder;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.resource.Resource;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;

import com.fasterxml.jackson.databind.ser.std.StdKeySerializers.Default;
import com.irkut.tc.mpdeditor.Activator;
import com.irkut.tc.mpdeditor.server.SparkServer;
import com.irkut.tc.mpdeditor.util.HandlerDataset;
import com.irkut.tc.mpdeditor.util.UpdateDataset;
import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.common.health.JettyServerStarter;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentDataset;
import com.teamcenter.rac.kernel.TCComponentManager;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCPreferenceService;
import com.teamcenter.rac.kernel.TCSession;

import java.io.IOException;
import java.net.URL;
import java.util.EnumSet;

import javax.management.RuntimeErrorException;
import javax.servlet.*;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class HandlerStartServer extends AbstractHandler{

	@Override
	public Object execute(ExecutionEvent arg0) throws ExecutionException {
		// TODO Auto-generated method stub
		Thread thread = new Thread(new Runnable() {
			
			@Override
			public void run() {
				Server server = new Server(9090);
		        ServletContextHandler context = new ServletContextHandler();
		        context.setContextPath("/");
		        
		        context.addFilter(MyCorsFilter.class, "/*", EnumSet.of(DispatcherType.REQUEST));
		        
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
		        context.addServlet(new ServletHolder(new HttpServlet() // getitem?uid=(uid) {
		        {
		            @Override
		            protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		                resp.getWriter().println("GET /getitem response");
		                
		                String uid = req.getParameter("uid");
		                
		                resp.getWriter().println("uid");
		                
		                TCSession session = (TCSession) AIFUtility.getDefaultSession();
		        		
		        		String datasetUID = uid;
		        		
		        		System.out.println("getDataset: " + datasetUID);
		        		
		        		if (datasetUID != null) {
		        			TCPreferenceService prefService = session.getPreferenceService();
		        			TCComponentManager cm = session.getComponentManager();
		        			TCComponent comp = null;
		        			try {
		        				comp = cm.getTCComponent(datasetUID);
		        			} catch (TCException e1) {
		        				// TODO Auto-generated catch block
		        				comp = null;
		        				e1.printStackTrace();
		        			}
		        			
		        			if (comp instanceof TCComponentDataset) {
		        				TCComponentDataset dataset = (TCComponentDataset) comp;
//		        				dataset.get
		        			}
		        			
		        			resp.setStatus(200);
		        			resp.setContentType("applicatin/json");
		        			resp.getWriter().write("{\"status\": \"ok\"}");
		        			resp.getWriter().flush();
		        			
		        			return;// TODO: как-то вернуть html; скорее всего надо в Base64
		        		}else {
//		        			response.status(400);// TODO: посмотреть какой статус подходит
		        		}
		        		
		        		return;
		                
		            }
		        }), "/getitem");
		 
		        ServletHolder holderGetDataset = new ServletHolder(new HandlerDataset());
		        context.addServlet(holderGetDataset, "/getdataset"); // getdataset?uid=(uid)
		        
		        ServletHolder holderUpdateDataset = new ServletHolder(new UpdateDataset());
		        context.addServlet(holderUpdateDataset, "/updatedataset"); // getdataset?uid=(uid)
		        
		        ServletHolder defauldHolder = new ServletHolder("static", DefaultServlet.class);
		        defauldHolder.setInitParameter("dirAllowed", "true");
		        defauldHolder.setInitParameter("pathInfoOnly", "true");
		        context.addServlet(defauldHolder, "/static/*");
//		        URL webRootUrl = HandlerStartServer.class.getResource("/public");
//		        if (webRootUrl == null) {
//		        	System.out.println("Не найдена папка public");
//		        	return;
//		        }
		        
		     

				
//		        server.setHandler(resource_handler);
		        server.setHandler(context);
		        try {
					server.start();
					
					System.out.println(
							HandlerStartServer.class.getResource("/public/index.html") != null ? "done" : "not rescource");
			        server.join();
				} catch (Exception e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}

				return;
			}
		});
		
		thread.start();
//		Activator.startSparkService();
		
		
		return null;
	}

}
