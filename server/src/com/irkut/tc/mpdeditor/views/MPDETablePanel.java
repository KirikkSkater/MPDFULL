package com.irkut.tc.mpdeditor.views;

import java.awt.Dimension;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import javax.swing.JPanel;
import javax.swing.JScrollPane;

import org.eclipse.jface.viewers.ISelectionChangedListener;
import org.eclipse.jface.viewers.SelectionChangedEvent;

import com.irkut.tc.mpdeditor.Activator;
import com.irkut.tc.ui.ExcelExportHelper;
import com.irkut.tc.util.ComponentsProvider;
import com.teamcenter.rac.aif.kernel.InterfaceAIFComponent;
import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.commands.exporttoexcel.ExportToExcelOperation;
import com.teamcenter.rac.common.TCTable;
import com.teamcenter.rac.common.genericselection.AbstractGenericSelectionPanel;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentItemRevision;
import com.teamcenter.rac.kernel.TCComponentType;
import com.teamcenter.rac.kernel.TCPreferenceService;
import com.teamcenter.rac.kernel.TCSession;
import com.teamcenter.rac.kernel.TCTypeService;
import com.teamcenter.rac.officeliveservices.ExcelExportOption;
import com.teamcenter.rac.officeliveservices.InterfaceExcelExportable;
import com.teamcenter.rac.util.Cookie;
import com.teamcenter.rac.util.MessageBox;
import com.teamcenter.rac.util.OSGIUtil;
import com.teamcenter.rac.util.Registry;
import com.teamcenter.rac.util.VerticalLayout;

public class MPDETablePanel  extends JPanel implements InterfaceExcelExportable
{
	/**
	 * 
	 */
	private static final long serialVersionUID = 6727610282113285506L;
	
	private TCTable table;
//	private SPMApplication app;
	
	private static final String COLS_PREF_NAME="MPDE_AbstractMPDETablePanel_ColumnPreferences";
	private static final String COL_W_PREF_NAME="MPDE_AbstractMPDETablePanel_ColumnWidthPreferences";	
	
	private ArrayList<TCComponentItem> loadedMPDEItems = new ArrayList<>();
		
	public MPDETablePanel(/*SPMApplication app*/)
	{
//		this.app=app;
		try
		{
			TCPreferenceService prefService = ((TCSession) AIFUtility.getDefaultSession()).getPreferenceService();
			String[] colNames = prefService.getStringValues(COLS_PREF_NAME);
			if (colNames==null||colNames.length==0)
			{
				System.out.println("MPDEListPanel:Setting default columns");
				//colNames=new String[] {"ISP8_AbstractSPRevision.item_id","ISP8_AbstractSPRevision.isp8_sp_type"};
				colNames=new String[] {"C3D_ItemS1000D4.item_id","C3D_ItemS1000D4.c3ds1000dic","C3D_ItemS1000D4.c3ds1000dicn"};
				prefService.setStringArray(TCPreferenceService.TC_preference_user, COLS_PREF_NAME, colNames);
				prefService.setStringArray(TCPreferenceService.TC_preference_user, COL_W_PREF_NAME, new String[] {"20","20","30","30"});				
//				prefService.setValuesForPreferences(new String[] {COLS_PREF_NAME}, new Object[][] {{colNames}});
			}
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		
		initUI();

//		table.getTablePreferences()
	}
	
	private void initUI()
	{
		setLayout(new VerticalLayout(1));
		Registry registry = Registry.getRegistry(AbstractGenericSelectionPanel.class);
				
//		table = new TCTable((TCSession) AIFUtility.getDefaultSession(), registry.getStringArray("genericSelection.columnsShown", ","));
	    TCComponentType typeComp = null;
	    try
	    {
	      TCTypeService typeService = (TCTypeService)OSGIUtil.getService(Activator.getDefault(), TCTypeService.class);
	      typeComp = typeService.getTypeComponent("C3D_ItemS1000D4");
	    }
	    catch (Exception e)
	    {
	    	e.printStackTrace();
	      MessageBox.post(e);
	      return;
	    }
		table = new TCTable((TCSession) AIFUtility.getDefaultSession(),COLS_PREF_NAME,COL_W_PREF_NAME,typeComp);	    
	    
//		table = new TCTable((TCSession) AIFUtility.getDefaultSession(),new String[] {"item_id","object_type"});

		table.assignColumnRenderer();
//		listPanel = new OpenByNamePanel((TCSession)AIFUtility.getDefaultSession(),"I8_SparePartBase",new String[] {"item_id","object_name","object_type"});
		add("unbound.bind.center.center",new JScrollPane(table));

//		table.setSelectionMode(0);
		
/*	    String str1 = "ISP8_AbstractSP_SPListPanel_ColumnPreferences";
	    String str2 = "ISP8_AbstractSP_SPListPanel_ColumnWidthPreferences";
	    String[] arrayOfString = { str1, str2 };
	    table.getTablePreferences().setTablePreferences(arrayOfString);
	    table.loadColumnPreferenceValue((TCSession) AIFUtility.getDefaultSession(), str1, str2, typeComp);		
*/	    
		table.addSelectionChangedListener(new ISelectionChangedListener() 
		{
			@Override
			public void selectionChanged(SelectionChangedEvent e) 
			{
				onTableSelectionChanged();
			}
		});
		setMinimumSize(new Dimension(250,300));
		setPreferredSize(new Dimension(250,300));
		table.setEditable(false);
		loadCookies();
	}
	
	public void loadCookies()
	{
		Cookie c = Cookie.getCookie("MPDEListPanel.prefs");
		try
		{
			int width = c.getNumber("width");
			if (width<250)
				width=250;
			setSize(new Dimension(width,getHeight()));			
			setPreferredSize(new Dimension(width,300));
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		try {
			c.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public void saveCookies()
	{
		Cookie c = Cookie.getCookie("MPDEListPanel.prefs");
		try
		{
			c.setString("width", getWidth());
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		try {
			c.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public void load(ComponentsProvider provider)
	{
		saveCookies();	
		table.clear();
		loadedMPDEItems.clear();
		if (provider!=null)
		{
			try
			{
				
				Collection<TCComponent> comps = provider.getComponents();
				for (TCComponent comp: comps)
				{
					
					if (comp instanceof TCComponentItem)
						loadedMPDEItems.add((TCComponentItem)comp);
					else if (comp instanceof TCComponentItemRevision)
						loadedMPDEItems.add(((TCComponentItemRevision)comp).getItem());
					table.assignColumnRenderer();
				}
				System.out.println("loadedMPDEItems: "+loadedMPDEItems.size());
			
				int added=0;
				while (added<loadedMPDEItems.size())
				{
					int quant = loadedMPDEItems.size()-added;
					if (quant>10)
						quant=10;
					ArrayList<TCComponentItem> lst = new ArrayList<>();
					for (int i=0; i<quant; i++, added++)
						lst.add(loadedMPDEItems.get(added));
					table.addRows(lst);
				
				}
				
//				table.addRows(loadedMPDEItems);
				
/*				for (TCComponentItemRevision spRev: loadedMPDEItems)
				{
					table.addRows(spRev);
					//table.assignColumnRenderer();
				}
*/
				System.out.println("table rows: "+table.getRowCount());
				table.assignColumnRenderer();
			}
			catch(Exception e)
			{
				e.printStackTrace();
			}
		}
	    table.validate();
	    table.repaint();		
	}
	
	public ArrayList<TCComponentItem> getLoadSparePartsList()
	{
		return new ArrayList<TCComponentItem>(loadedMPDEItems);
	}
	
	public void loadData(List<TCComponentItem> data)
	{
		
	}
	


	public void exportListToExcel()
	{
		InterfaceAIFComponent [] aics = table.getRowComponents(0, table.getRowCount()-1);
		String [] propNames = table.getColumnPropertyNames();
		Arrays.sort(propNames,0,propNames.length);
		
		if (propNames!=null)
		{
			for (String s: propNames)
				System.out.println("Prop: "+s);
			
		}
		System.out.println("COMPS SIZE: "+aics!=null?aics.length:0);
		short option=1;//3
//		ExportToExcelOperation op = new ExportToExcelOperation(aics,option,table.getColumnPropertyNames(),"REQ_defview_multi_template","Exporting....",false,false);
		ExportToExcelOperation op = new ExportToExcelOperation(aics,option,table.getColumnPropertyNames(),null,"Exporting....",false,true);		
		try
		{
			AIFUtility.getDefaultSession().queueOperationLater(op);
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		
//		ExportToExcelCommand cmd = new ExportToExcelCommand(AIFUtility.getActiveDesktop().getDesktopWindow().getShell(),aics,"TCComponentView");
//		SwingUtilities.invokeLater(cmd);
//		ExportToExcelDialog dlg = new ExportToExcelDialog(AIFUtility.getActiveDesktop().getDesktopWindow().getShell(),aics,"TCComponentView");
//		AbstractAIFCommand cmd = new AbstractAOF
	}
	
	protected void onTableSelectionChanged()
	{
		InterfaceAIFComponent[] iacs = table.getSelectedComponents();
		if (iacs!=null&&iacs.length>0)
		{
//			if (iacs[0] instanceof TCComponentItem) // TODO: добавить app
//				app.sparePartSelected((TCComponentItem) iacs[0], null);
//			else if (iacs[0] instanceof TCComponentItemRevision)
//				app.sparePartSelected(null, (TCComponentItemRevision) iacs[0]);
			
		}
		
	}
	
	public InterfaceAIFComponent[] getSelectedComponents()
	{
		return table.getSelectedComponents();
	}
	
	public void close()
	{
		saveCookies();
	}

	@Override
	public TCComponent[] getComponentsToExport(ExcelExportOption opt) 
	{
		TCComponent[] comps = null;
		if (table.getRowCount()>0)
		{
			ArrayList<TCComponent> lst = new ArrayList<>();
			for (int i=0; i<table.getRowCount(); i++)
			{
				InterfaceAIFComponent aic = table.getRowComponent(i);
				if (aic instanceof TCComponent)
					lst.add((TCComponent) aic);
			}
			if (lst.size()>0)
				return lst.toArray(new TCComponent[lst.size()]);
		}
		return null;
	}

	@Override
	public String[] getDisplayedPropertyNames() 
	{
		return ExcelExportHelper.getTablePropsExportNames(table);
	}
}