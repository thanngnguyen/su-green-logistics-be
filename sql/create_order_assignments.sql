-- Bảng order_assignments: Quản lý việc phân công đơn hàng cho nhiều tài xế
-- Admin phân công đơn → nhiều tài xế nhận thông báo → ai nhận trước được giao đơn

CREATE TABLE IF NOT EXISTS order_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    reject_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Mỗi tài xế chỉ được phân công 1 lần cho mỗi đơn hàng
    UNIQUE(order_id, driver_id)
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_order_assignments_order_id ON order_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_assignments_driver_id ON order_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_order_assignments_status ON order_assignments(status);
CREATE INDEX IF NOT EXISTS idx_order_assignments_driver_status ON order_assignments(driver_id, status);

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_order_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_assignments_updated_at ON order_assignments;
CREATE TRIGGER trigger_update_order_assignments_updated_at
    BEFORE UPDATE ON order_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_assignments_updated_at();

-- RLS Policies cho order_assignments
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;

-- Admin có thể xem tất cả
CREATE POLICY "admin_all_order_assignments" ON order_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Driver chỉ xem được phân công của mình
CREATE POLICY "driver_view_own_assignments" ON order_assignments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM drivers 
            WHERE drivers.id = order_assignments.driver_id 
            AND drivers.user_id = auth.uid()
        )
    );

-- Driver có thể cập nhật phân công của mình (để accept/reject)
CREATE POLICY "driver_update_own_assignments" ON order_assignments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM drivers 
            WHERE drivers.id = order_assignments.driver_id 
            AND drivers.user_id = auth.uid()
        )
    );

-- Comment
COMMENT ON TABLE order_assignments IS 'Quản lý phân công đơn hàng cho nhiều tài xế';
COMMENT ON COLUMN order_assignments.status IS 'Trạng thái: pending (chờ phản hồi), accepted (đã nhận), rejected (từ chối)';
