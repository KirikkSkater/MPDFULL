package com.irkut.tc.mpdeditor.views;


import java.awt.Frame;
import java.security.Provider;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;

import javax.swing.BoxLayout;

import org.eclipse.jface.action.Action;
import org.eclipse.jface.action.ControlContribution;
import org.eclipse.jface.action.IMenuCreator;
import org.eclipse.jface.action.IToolBarManager;
import org.eclipse.swt.SWT;
import org.eclipse.swt.awt.SWT_AWT;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Combo;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Control;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.Menu;
import org.eclipse.swt.widgets.MenuItem;
import org.eclipse.swt.widgets.ToolBar;
import org.eclipse.swt.widgets.ToolItem;
import org.eclipse.ui.part.ViewPart;

import com.irkut.tc.mpdeditor.Activator;
import com.irkut.tc.util.ComponentsProvider;
import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.kernel.AbstractRACPlugin;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentManager;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCPreferenceService;
import com.teamcenter.rac.kernel.TCSession;
import com.teamcenter.rac.views.AbstractRACView;
// test
public class MPDETableView extends ViewPart implements IUpdaterInfoCode
{ // TODO: перенести всё в формочку и UPdaterInfoCode
	
public static final String ID = "com.irkut.tc.mpdeditor.views.mpdetableview";


	private Combo codeCombo;
	private Label statusLabel;
	private String selectedCode = "";
	private Composite mainComposite;
	private ArrayList<TCComponent> objs;
	private TCSession session;
	
	private MPDETablePanel tablePanel;
	
	ComponentsProvider provider;
	
	private ArrayList<IUpdaterInfoCode> updaters; // TODO: временное решение
	public void addUpdaters(IUpdaterInfoCode updater) {
		updaters.add(updater);
	}
	
	public ArrayList<IUpdaterInfoCode> getUpdaters() {
		return updaters;
	}
	
	@Override
	public void createPartControl(Composite paramComposite) {
		updaters = new ArrayList<IUpdaterInfoCode>();
		addUpdaters(this);
		
//		Activator.getApplication().addUpdaters(this);
		// TODO Auto-generated method stub
//		paramComposite.setLayout();
		
//		Action dropdown = new Action("Инфо-код", SWT.DROP_DOWN) {
//			@Override
//			public void run() {
//				//
//			}
//		};
		
		
//		dropdown.setToolTipText("Выберите поле");
//		dropdown.setImageDescriptor(Activator.imageDescriptorFromPlugin("com.irkut.tc.mpdeditor", "icons/sample.png"));
//		
//        dropdown.setMenuCreator(new IMenuCreator() {
//            private Menu menu;
// 
//            @Override
//            public void dispose() {
//                if (menu != null && !menu.isDisposed()) {
//                    menu.dispose();
//                }
//            }
// 
//            @Override
//            public Menu getMenu(Control parent) {
//                if (menu != null && !menu.isDisposed()) {
//                    menu.dispose(); // пересоздаем меню каждый раз
//                }
//                menu = new Menu(parent);
//                createMenuItems(menu);
//                return menu;
//            }
// 
//            @Override
//            public Menu getMenu(Menu parent) {
//                return null;
//            }
// 
//            private void createMenuItems(Menu menu) {
//                String[] fields = getCustomFields(); // получаем список
//                for (String field : fields) {
//                    MenuItem item = new MenuItem(menu, SWT.CHECK);
//                    item.setText(field);
//                    item.addListener(SWT.Selection, e -> {
//                        boolean checked = item.getSelection();
//                        onFieldToggle(field, checked);
//                    });
//                }
//            }
//        });
        
//        IToolBarManager tbM = getViewSite().getActionBars().getToolBarManager();
////        tbM.add(dropdown);
//        
//        ToolBar tb = new ToolBar(getViewSite().getShell(), SWT.FLAT);
//        ToolItem comboItem = new ToolItem(tb, SWT.SEPARATOR);
//        
//		Combo combo = new Combo(tb, SWT.DROP_DOWN);
//		combo.setItems(new String[] {"01A2", "03A3"});
//		
//		comboItem.setControl(combo);
//		comboItem.setWidth(150);
//		
//		tbM.add(new ControlContribution("ComboHolder") {
//
//			@Override
//			protected Control createControl(Composite arg0) {
//				// TODO Auto-generated method stub
//				return tb;
//			}
//			
//		});
//		
//		tbM.update(true);
//
		session = (TCSession) AIFUtility.getDefaultSession();

		TCPreferenceService prefService = session.getPreferenceService();
		TCComponentManager cm = session.getComponentManager();
		
		String[] uids = new String[] {"D6chX1IKh326oC", "WMVd$Xv9h326oC", "rJchUQZOh326oC" };
		
		objs = new ArrayList<TCComponent>();
		
		TCComponentItem temp = null;
		
//		for (String uid : uids) {
//			try {
//				temp = (TCComponentItem) cm.getTCComponent(uid);
//			} catch (TCException e1) {
//				// TODO Auto-generated catch block
//				temp = null;
//				e1.printStackTrace();
//			}
//			if (temp != null) {
//				objs.add(temp);
//			}
//		}
		
		Composite CompositeEmb = new Composite(paramComposite, SWT.EMBEDDED);
		
		Frame frame = SWT_AWT.new_Frame(CompositeEmb);
		
		frame.setLayout(new BoxLayout(frame, BoxLayout.X_AXIS));
		
		tablePanel = new MPDETablePanel();
		
		provider = new ComponentsProvider() {
			
			@Override
			public Collection<TCComponent> getComponents() {
				// TODO Auto-generated method stub
				return objs;
			}
		};
		
//		Provider
		tablePanel.load(provider);
		
		frame.add(tablePanel);
//		frame.add(form);
		createToolbar();
		
	}
	
	private void createToolbar() {
        IToolBarManager toolBarManager = getViewSite().getActionBars().getToolBarManager();
        
        // Добавляем выпадающий список в тулбар
        toolBarManager.add(new ControlContribution("CodeSelector") {
            @Override
            protected Control createControl(Composite parent) {
                Composite container = new Composite(parent, SWT.NONE);
                container.setLayout(new GridLayout(2, false));
                
                Label label = new Label(container, SWT.NONE);
                label.setText("Выбранный код:");
                
                codeCombo = new Combo(container, SWT.DROP_DOWN | SWT.READ_ONLY);
//                codeCombo.setItems(Activator.getApplication().getCustomFields());

                codeCombo.setItems(getCustomFields());
                codeCombo.select(0);
                selectedCode = codeCombo.getItem(0);
                
                // Обработчик выбора значения
                codeCombo.addSelectionListener(new SelectionAdapter() {
                    @Override
                    public void widgetSelected(SelectionEvent e) {
                        selectedCode = codeCombo.getText();
                        updateForm();
                    }
                });
                
                return container;
            }
        });
        
        toolBarManager.update(true);
    }
	
	public void updateForm() {
//        if (statusLabel != null && !statusLabel.isDisposed()) {
//            statusLabel.setText("Выбранный код: " + selectedCode);
//            mainComposite.layout();
//        }
		
		// TODO:
		System.out.println("update форм selectedCode: " + selectedCode);
		
//		for (IUpdaterInfoCode updater : Activator.getApplication().getUpdaters()) {

		for (IUpdaterInfoCode updater : updaters) {
			updater.updateInfoCode(selectedCode);
		}
		
    }


	
    private String[] getCustomFields() {
        // Здесь логика получения текущего списка настраиваемых полей
        return new String[] {"", "0B3A", "0B4A", "0B1A", "941", "041"};
    }
 
//	public void updateComboItems(String newItems) {
//		if ()
//		
//	}

	@Override
	public void setFocus() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void updateInfoCode(String code) {
		// TODO Auto-generated method stub
		if (selectedCode.equals("")) {
			objs.clear();
			tablePanel.load(provider);
			return;
		}
		
		TCComponent[] comps = null;
		try {
			comps = session.getClassService().findByClassMulti("C3D_ItemS1000D4", new String[]{"c3ds1000dic"}, new String[]{code}); // todo вынести service
		} catch (TCException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		objs.clear();
		Collections.addAll(objs, comps);
		
		tablePanel.load(provider);
	}

	
}

