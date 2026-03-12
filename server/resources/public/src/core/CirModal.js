/**
 * CirModal - модальное окно для выбора применимостей из CIR
 */
class CirModal {
    constructor(applicManager, onSelect) {
        this.applicManager = applicManager;
        this.onSelect = onSelect; // Callback при выборе применимости
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.searchQuery = '';
        this.filteredItems = [];
        this.allItems = [];
        this.$modal = null;
    }

    async open() {
        // Загружаем CIR если еще не загружен
        try {
            await this.applicManager.pullCIR();
            this.allItems = Object.values(this.applicManager.cirCache);
            this.filteredItems = [...this.allItems];
            this.currentPage = 1;
            this.render();
        } catch (error) {
            alert('Ошибка загрузки CIR: ' + error.message);
        }
    }

    render() {
        // Удаляем старое модальное окно если есть
        if (this.$modal) {
            this.$modal.remove();
        }

        this.$modal = this.createModalHTML();
        $('body').append(this.$modal);

        // Привязываем обработчики
        this.bindEvents();

        // Рендерим список
        this.renderList();

        // Показываем модальное окно
        this.$modal.modal('show');
    }

    createModalHTML() {
        const $modal = $(`
            <div class="modal fade" id="cirModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Выбор применимости из CIR</h5>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <!-- Поиск -->
                            <div class="form-group">
                                <input 
                                    type="text" 
                                    class="form-control cir-search-input" 
                                    placeholder="Поиск по applicIdentValue..."
                                    value="${this.searchQuery}"
                                />
                            </div>
                            
                            <!-- Список применимостей -->
                            <div class="cir-list-container" style="max-height: 400px; overflow-y: auto;">
                                <div class="cir-list"></div>
                            </div>
                            
                            <!-- Пагинация -->
                            <div class="cir-pagination mt-3 d-flex justify-content-between align-items-center">
                                <button class="btn btn-sm btn-outline-secondary cir-prev-btn">
                                    ← Предыдущая
                                </button>
                                <span class="cir-page-info"></span>
                                <button class="btn btn-sm btn-outline-secondary cir-next-btn">
                                    Следующая →
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        return $modal;
    }

    bindEvents() {
        const self = this;

        // Поиск с debounce
        let searchTimeout;
        this.$modal.find('.cir-search-input').on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                self.searchQuery = $(this).val().trim();
                self.applyFilter();
            }, 300);
        });

        // Пагинация
        this.$modal.find('.cir-prev-btn').on('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderList();
            }
        });

        this.$modal.find('.cir-next-btn').on('click', () => {
            const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderList();
            }
        });

        // Очистка при закрытии
        this.$modal.on('hidden.bs.modal', () => {
            this.$modal.remove();
            this.$modal = null;
        });
    }

    applyFilter() {
        if (!this.searchQuery) {
            this.filteredItems = [...this.allItems];
        } else {
            const lowerQuery = this.searchQuery.toLowerCase();
            this.filteredItems = this.allItems.filter(item => 
                item.applicIdentValue.toLowerCase().includes(lowerQuery)
            );
        }
        
        this.currentPage = 1;
        this.renderList();
    }

    renderList() {
        const $list = this.$modal.find('.cir-list');
        $list.empty();

        // Вычисляем диапазон для текущей страницы
        const startIdx = (this.currentPage - 1) * this.itemsPerPage;
        const endIdx = Math.min(startIdx + this.itemsPerPage, this.filteredItems.length);
        const pageItems = this.filteredItems.slice(startIdx, endIdx);

        if (pageItems.length === 0) {
            $list.append(
                $('<div></div>')
                    .addClass('text-center text-muted p-4')
                    .text('Ничего не найдено')
            );
        } else {
            pageItems.forEach(item => {
                const $item = this.renderCirItem(item);
                $list.append($item);
            });
        }

        // Обновляем информацию о пагинации
        this.updatePagination();
    }

    renderCirItem(item) {
        const $item = $('<div></div>')
            .addClass('cir-item p-2 border-bottom')
            .css('cursor', 'pointer')
            .on('mouseenter', function() {
                $(this).addClass('bg-light');
            })
            .on('mouseleave', function() {
                $(this).removeClass('bg-light');
            })
            .on('click', () => {
                this.selectItem(item);
            });

        $item.append(
            $('<div></div>').addClass('font-weight-bold').text(item.applicIdentValue),
            $('<div></div>').addClass('small text-muted').text(`ID: ${item.applicMapRefId || 'N/A'}`)
        );

        return $item;
    }

    async selectItem(item) {
        try {
            // Добавляем применимость из CIR
            const newId = await this.applicManager.addApplicFromCir(item.applicIdentValue);
            
            if (newId && this.onSelect) {
                this.onSelect(newId);
            }

            // Закрываем модальное окно
            this.$modal.modal('hide');
        } catch (error) {
            console.error('Error selecting CIR item:', error);
            alert('Ошибка при добавлении применимости: ' + error.message);
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        const $pageInfo = this.$modal.find('.cir-page-info');
        const $prevBtn = this.$modal.find('.cir-prev-btn');
        const $nextBtn = this.$modal.find('.cir-next-btn');

        $pageInfo.text(`Страница ${this.currentPage} из ${totalPages} (всего: ${this.filteredItems.length})`);

        // Управление состоянием кнопок
        $prevBtn.prop('disabled', this.currentPage === 1);
        $nextBtn.prop('disabled', this.currentPage >= totalPages);
    }

    close() {
        if (this.$modal) {
            this.$modal.modal('hide');
        }
    }
}
